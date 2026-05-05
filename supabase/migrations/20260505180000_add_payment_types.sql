-- Payment types: advance_delivery (customer pays only the delivery charge
-- upfront, courier collects the rest in cash) vs full_payment (customer
-- pays the entire order total upfront). Each payment method is tagged so
-- the storefront knows which amount to ask for, and each order tracks
-- whether the customer has paid the advance, paid in full, or is unpaid.
--
-- Backwards-compatible: existing methods keep working as full_payment by
-- default, existing orders get payment_status='unpaid', and the
-- submit_payment RPC keeps the same call signature — it now derives the
-- payment type from the chosen method instead of taking an extra arg.

-- ---------------------------------------------------------------------------
-- 1. payment_methods.payment_type
-- ---------------------------------------------------------------------------
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'full_payment';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_methods_payment_type_check'
  ) THEN
    ALTER TABLE public.payment_methods
      ADD CONSTRAINT payment_methods_payment_type_check
      CHECK (payment_type IN ('advance_delivery', 'full_payment'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. orders.payment_status
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('unpaid', 'delivery_paid', 'fully_paid', 'refunded'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_payment_status_idx
  ON public.orders (payment_status);

-- ---------------------------------------------------------------------------
-- 3. payment_submissions.payment_type (denormalised copy from the method)
-- ---------------------------------------------------------------------------
ALTER TABLE public.payment_submissions
  ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- ---------------------------------------------------------------------------
-- 4. submit_payment — same signature, now stamps payment_type from method.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_payment(
  p_order_id        TEXT,
  p_method_key      TEXT,
  p_customer_name   TEXT,
  p_customer_phone  TEXT,
  p_transaction_id  TEXT,
  p_amount          NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id   UUID;
  v_type TEXT;
BEGIN
  IF p_order_id IS NULL OR length(trim(p_order_id)) = 0 THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;
  IF p_method_key IS NULL OR length(trim(p_method_key)) = 0 THEN
    RAISE EXCEPTION 'method_key is required';
  END IF;
  IF p_transaction_id IS NULL OR length(trim(p_transaction_id)) = 0 THEN
    RAISE EXCEPTION 'transaction_id is required';
  END IF;

  SELECT payment_type INTO v_type
  FROM public.payment_methods
  WHERE key = p_method_key
  LIMIT 1;

  -- Default to full_payment for unknown / legacy methods so the row is
  -- still valid even if an admin removed the method between page-load
  -- and submission.
  v_type := COALESCE(v_type, 'full_payment');

  INSERT INTO public.payment_submissions (
    order_id, method_key, customer_name, customer_phone,
    transaction_id, amount, payment_type
  )
  VALUES (
    LEFT(p_order_id,       64),
    LEFT(p_method_key,     32),
    LEFT(p_customer_name,  120),
    LEFT(p_customer_phone, 32),
    LEFT(p_transaction_id, 64),
    p_amount,
    v_type
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_payment(
  TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. verify_payment_submission — admin marks a submission as verified
--    or rejected; on verify it bumps the order's payment_status.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_payment_submission(
  p_submission_id UUID,
  p_status        TEXT,
  p_admin_note    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id TEXT;
  v_type     TEXT;
  v_new_pay  TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('pending', 'verified', 'rejected') THEN
    RAISE EXCEPTION 'invalid status %', p_status;
  END IF;

  UPDATE public.payment_submissions
     SET status     = p_status,
         admin_note = COALESCE(p_admin_note, admin_note),
         updated_at = now()
   WHERE id = p_submission_id
   RETURNING order_id, payment_type INTO v_order_id, v_type;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'submission % not found', p_submission_id;
  END IF;

  IF p_status = 'verified' THEN
    v_new_pay := CASE
      WHEN v_type = 'advance_delivery' THEN 'delivery_paid'
      ELSE 'fully_paid'
    END;
    UPDATE public.orders
       SET payment_status = v_new_pay,
           updated_at     = now()
     WHERE order_id = v_order_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_payment_submission(UUID, TEXT, TEXT)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. get_order_tracking — same signature plus payment_status column at end.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_order_tracking(TEXT);

CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id TEXT)
RETURNS TABLE (
  order_id TEXT,
  status TEXT,
  delivery_area TEXT,
  delivery_charge NUMERIC,
  subtotal NUMERIC,
  discount_amount NUMERIC,
  total NUMERIC,
  items JSONB,
  customer_name_initial TEXT,
  phone_masked TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  payment_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.order_id,
    o.status,
    o.delivery_area,
    COALESCE(o.delivery_charge, 0)::numeric AS delivery_charge,
    o.subtotal,
    COALESCE(o.discount_amount, 0)::numeric AS discount_amount,
    o.total,
    o.items,
    LEFT(o.customer_name, 1) AS customer_name_initial,
    CASE
      WHEN length(o.phone) > 4
        THEN repeat('•', length(o.phone) - 3) || right(o.phone, 3)
      ELSE o.phone
    END AS phone_masked,
    o.created_at,
    o.updated_at,
    o.payment_status
  FROM public.orders o
  WHERE o.order_id = p_order_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(TEXT)
  TO anon, authenticated;
