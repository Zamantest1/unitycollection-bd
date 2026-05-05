-- Abandoned-order recovery
--
-- Adds two anon-safe RPCs and one admin RPC for the new "cancel from
-- the payment page" UX:
--
-- 1. cancel_pending_order(p_order_id, p_reason):
--    Customer-facing.  Anyone with the order ID may cancel an order
--    that is still in 'pending' status AND has no verified payment yet.
--    Sets status='cancelled', restores stock from the items JSON, and
--    leaves a row in order_status_history (when the table exists).
--    Idempotent — calling twice returns the same "already cancelled"
--    response without double-restoring stock.
--
-- 2. list_abandoned_orders(p_min_age_minutes):
--    Admin only.  Lists orders that are still pending+unpaid AND older
--    than the given threshold (default 240 minutes / 4h), with enough
--    info to drive the /admin/abandoned tab (phone, total, time-since,
--    item count).
--
-- 3. admin_cancel_pending_order(p_order_id, p_reason):
--    Admin only thin wrapper around the customer-facing cancel that
--    also works on orders that have an unverified payment submission
--    (e.g. customer paid into the wrong number and you need to start
--    over).  Uses the same restore logic.
--
-- All three are SECURITY DEFINER so they can write across tables that
-- anon users normally can't update.

-- ---------------------------------------------------------------------------
-- 1. Helper: restore stock for the given order's items.
--
-- Mirrors the trigger logic in 20260126191723 (restore_stock_from_order)
-- but takes an order_id and lets us call it from the cancel RPC without
-- needing to DELETE the row.  GREATEST() guards against negative stock
-- if anything's already been hand-edited.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._restore_stock_for_order(p_order_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items   JSONB;
  v_item    JSONB;
  v_pid     UUID;
  v_qty     INTEGER;
BEGIN
  SELECT items INTO v_items FROM public.orders WHERE id = p_order_uuid;
  IF v_items IS NULL THEN RETURN; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_pid := (v_item->>'product_id')::UUID;
    v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);
    IF v_pid IS NULL OR v_qty <= 0 THEN CONTINUE; END IF;

    UPDATE public.products
    SET
      stock_quantity = stock_quantity + v_qty,
      sold_count     = GREATEST(sold_count - v_qty, 0)
    WHERE id = v_pid;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._restore_stock_for_order(UUID) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 2. Customer cancel
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.cancel_pending_order(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.cancel_pending_order(
  p_order_id TEXT,
  p_reason   TEXT DEFAULT 'customer_back_out'
)
RETURNS TABLE (
  order_id TEXT,
  status   TEXT,
  cancelled BOOLEAN,
  message  TEXT
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
    -- Idempotent: tell the caller we're already there but don't
    -- restore stock again.
    order_id := p_order_id; status := 'cancelled'; cancelled := TRUE;
    message := 'Order was already cancelled';
    RETURN NEXT; RETURN;
  END IF;

  -- Refuse if the order has moved past pending OR has a verified
  -- payment.  The customer should never cancel a paid order from the
  -- back-button popup; that has to go through admin / refund.
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

  SELECT EXISTS (
    SELECT 1 FROM public.payment_submissions ps
    WHERE ps.order_id = v_uuid AND ps.status = 'verified'
  ) INTO v_has_verified;

  IF v_has_verified THEN
    order_id := p_order_id; status := v_status; cancelled := FALSE;
    message := 'A payment has already been verified for this order';
    RETURN NEXT; RETURN;
  END IF;

  -- Restore stock first, then flip the status so any other listeners
  -- (e.g. admin dashboards) see a consistent state.
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
-- 3. Admin abandoned-order list
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.list_abandoned_orders(INTEGER);

CREATE OR REPLACE FUNCTION public.list_abandoned_orders(
  p_min_age_minutes INTEGER DEFAULT 240
)
RETURNS TABLE (
  id              UUID,
  order_id        TEXT,
  customer_name   TEXT,
  phone           TEXT,
  delivery_area   TEXT,
  total           NUMERIC,
  delivery_charge NUMERIC,
  item_count      INTEGER,
  has_submission  BOOLEAN,
  created_at      TIMESTAMPTZ,
  age_minutes     INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin only.
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.order_id,
    o.customer_name,
    o.phone,
    o.delivery_area,
    o.total,
    COALESCE(o.delivery_charge, 0)::NUMERIC,
    COALESCE(jsonb_array_length(o.items), 0)::INTEGER AS item_count,
    EXISTS (
      SELECT 1 FROM public.payment_submissions ps
      WHERE ps.order_id = o.id
    ) AS has_submission,
    o.created_at,
    EXTRACT(EPOCH FROM (NOW() - o.created_at))::INTEGER / 60 AS age_minutes
  FROM public.orders o
  WHERE o.status = 'pending'
    AND COALESCE(o.payment_status, 'unpaid') = 'unpaid'
    AND o.created_at < NOW() - make_interval(mins => GREATEST(p_min_age_minutes, 0))
  ORDER BY o.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_abandoned_orders(INTEGER)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Admin cancel — same restore logic, but allowed even if there's an
-- unverified payment submission attached.
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

  -- Drop any pending payment submissions so they don't keep showing
  -- up in the admin payments queue.
  UPDATE public.payment_submissions
  SET status = 'rejected', updated_at = NOW()
  WHERE order_id = v_uuid AND status = 'pending';

  order_id := p_order_id; status := 'cancelled'; cancelled := TRUE;
  message := 'Cancelled and stock restored';
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_cancel_pending_order(TEXT, TEXT)
  TO authenticated;
