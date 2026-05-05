-- Fix: cancel_pending_order and admin_cancel_pending_order were
-- comparing payment_submissions.order_id (text) against orders.id
-- (uuid).  Postgres correctly refuses the implicit cast and the
-- customer-side cancel popup raises:
--
--   operator does not exist: text = uuid
--
-- payment_submissions.order_id stores the human-readable order code
-- (e.g. "UC-1234"), not the orders table's UUID.  Compare the right
-- column on both sides.

-- ---------------------------------------------------------------------------
-- cancel_pending_order — compare ps.order_id to the supplied text id.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.cancel_pending_order(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.cancel_pending_order(
  p_order_id TEXT,
  p_reason   TEXT DEFAULT 'customer_back_out'
)
RETURNS TABLE (
  order_id  TEXT,
  status    TEXT,
  cancelled BOOLEAN,
  message   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid     UUID;
  v_status   TEXT;
  v_paystat  TEXT;
  v_has_verified BOOLEAN;
BEGIN
  SELECT o.id, o.status, COALESCE(o.payment_status, 'unpaid')
    INTO v_uuid, v_status, v_paystat
  FROM public.orders o
  WHERE o.order_id = p_order_id
  LIMIT 1;

  IF v_uuid IS NULL THEN
    order_id := p_order_id; status := NULL; cancelled := FALSE;
    message := 'Order not found';
    RETURN NEXT; RETURN;
  END IF;

  IF v_status = 'cancelled' THEN
    order_id := p_order_id; status := 'cancelled'; cancelled := TRUE;
    message := 'Order was already cancelled';
    RETURN NEXT; RETURN;
  END IF;

  IF v_status <> 'pending' THEN
    order_id := p_order_id; status := v_status; cancelled := FALSE;
    message := 'Order is no longer pending and cannot be cancelled here';
    RETURN NEXT; RETURN;
  END IF;

  IF v_paystat IN ('delivery_paid', 'fully_paid') THEN
    order_id := p_order_id; status := v_status; cancelled := FALSE;
    message := 'Payment already verified — please contact support to refund';
    RETURN NEXT; RETURN;
  END IF;

  -- payment_submissions.order_id is TEXT (the human order code).
  SELECT EXISTS (
    SELECT 1 FROM public.payment_submissions ps
    WHERE ps.order_id = p_order_id AND ps.status = 'verified'
  ) INTO v_has_verified;

  IF v_has_verified THEN
    order_id := p_order_id; status := v_status; cancelled := FALSE;
    message := 'A payment has already been verified for this order';
    RETURN NEXT; RETURN;
  END IF;

  PERFORM public._restore_stock_for_order(v_uuid);

  UPDATE public.orders
  SET
    status     = 'cancelled',
    updated_at = NOW(),
    notes      = COALESCE(notes, '')
                  || CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE E'\n' END
                  || '[' || NOW()::TEXT || '] Cancelled — '
                  || COALESCE(NULLIF(p_reason, ''), 'no_reason')
  WHERE id = v_uuid;

  order_id := p_order_id; status := 'cancelled'; cancelled := TRUE;
  message := 'Order cancelled and stock restored';
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_pending_order(TEXT, TEXT)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_cancel_pending_order — same fix on the rejected-submission UPDATE.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_cancel_pending_order(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.admin_cancel_pending_order(
  p_order_id TEXT,
  p_reason   TEXT DEFAULT 'admin_cancel'
)
RETURNS TABLE (
  order_id  TEXT,
  status    TEXT,
  cancelled BOOLEAN,
  message   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid    UUID;
  v_status  TEXT;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT o.id, o.status INTO v_uuid, v_status
  FROM public.orders o
  WHERE o.order_id = p_order_id
  LIMIT 1;

  IF v_uuid IS NULL THEN
    order_id := p_order_id; status := NULL; cancelled := FALSE;
    message := 'Order not found';
    RETURN NEXT; RETURN;
  END IF;

  IF v_status = 'cancelled' THEN
    order_id := p_order_id; status := 'cancelled'; cancelled := TRUE;
    message := 'Already cancelled';
    RETURN NEXT; RETURN;
  END IF;

  IF v_status NOT IN ('pending', 'confirmed') THEN
    order_id := p_order_id; status := v_status; cancelled := FALSE;
    message := 'Order has already shipped/delivered — cannot auto-cancel';
    RETURN NEXT; RETURN;
  END IF;

  PERFORM public._restore_stock_for_order(v_uuid);

  UPDATE public.orders
  SET
    status         = 'cancelled',
    payment_status = 'unpaid',
    updated_at     = NOW(),
    notes          = COALESCE(notes, '')
                       || CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE E'\n' END
                       || '[' || NOW()::TEXT || '] Admin cancel — '
                       || COALESCE(NULLIF(p_reason, ''), 'no_reason')
  WHERE id = v_uuid;

  -- payment_submissions.order_id is TEXT, match the human code.
  UPDATE public.payment_submissions
  SET status = 'rejected', updated_at = NOW()
  WHERE order_id = p_order_id AND status = 'pending';

  order_id := p_order_id; status := 'cancelled'; cancelled := TRUE;
  message := 'Cancelled and stock restored';
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_cancel_pending_order(TEXT, TEXT)
  TO authenticated;
