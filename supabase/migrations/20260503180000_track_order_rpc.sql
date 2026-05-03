-- Public order tracking RPC.
--
-- Anonymous customers shouldn't be able to read the orders table directly
-- (admin-only RLS policies remain), but they should be able to look up the
-- status of *their* order if they know the order_id (which we hand out at
-- checkout). This SECURITY DEFINER function returns only the fields safe
-- to expose to a customer with the order_id token.
--
-- Returns NULL if the order_id doesn't exist.

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
  updated_at TIMESTAMPTZ
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
    -- Show only first letter of name to confirm match without exposing PII.
    LEFT(o.customer_name, 1) AS customer_name_initial,
    -- Mask phone: keep last 3 digits, mask the rest.
    CASE
      WHEN length(o.phone) > 4
        THEN repeat('•', length(o.phone) - 3) || right(o.phone, 3)
      ELSE o.phone
    END AS phone_masked,
    o.created_at,
    o.updated_at
  FROM public.orders o
  WHERE o.order_id = p_order_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(TEXT) TO anon, authenticated;
