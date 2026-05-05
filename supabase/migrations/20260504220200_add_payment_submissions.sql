-- Customer-submitted mobile-banking payment proofs.
--
-- When a customer says "I sent ৳X via bKash, here is my Transaction ID",
-- that submission lands in this table so admins can verify it on the
-- /admin/payments page instead of digging through WhatsApp.

CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        TEXT NOT NULL,
  method_key      TEXT NOT NULL,
  customer_name   TEXT,
  customer_phone  TEXT,
  transaction_id  TEXT NOT NULL,
  amount          NUMERIC,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_note      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- We don't FK to orders.order_id because the storefront should still record
-- a submission even if the customer typos the order_id; admins resolve the
-- mismatch manually. We do index for fast lookup though.
CREATE INDEX IF NOT EXISTS payment_submissions_order_id_idx
  ON public.payment_submissions (order_id);
CREATE INDEX IF NOT EXISTS payment_submissions_status_idx
  ON public.payment_submissions (status);
CREATE INDEX IF NOT EXISTS payment_submissions_created_at_idx
  ON public.payment_submissions (created_at DESC);

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage payment submissions"
  ON public.payment_submissions;
CREATE POLICY "Admins can manage payment submissions"
  ON public.payment_submissions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Anon writes go via this RPC (security definer) so we can validate inputs
-- without granting direct INSERT to the table.
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
  v_id UUID;
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

  INSERT INTO public.payment_submissions (
    order_id, method_key, customer_name, customer_phone, transaction_id, amount
  )
  VALUES (
    LEFT(p_order_id,       64),
    LEFT(p_method_key,     32),
    LEFT(p_customer_name,  120),
    LEFT(p_customer_phone, 32),
    LEFT(p_transaction_id, 64),
    p_amount
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_payment(
  TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC
) TO anon, authenticated;

DROP TRIGGER IF EXISTS update_payment_submissions_updated_at
  ON public.payment_submissions;
CREATE TRIGGER update_payment_submissions_updated_at
  BEFORE UPDATE ON public.payment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
