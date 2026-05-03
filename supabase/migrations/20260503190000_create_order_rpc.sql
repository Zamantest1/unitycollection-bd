-- Public order-creation RPC.
--
-- Anonymous customers cannot SELECT from `orders` (admin-only RLS), so a plain
-- `insert(...).select(...)` won't return the freshly-generated order_id back to
-- the client. The existing BEFORE-INSERT trigger (`generate_order_id`) also
-- *unconditionally* overwrites whatever order_id the client passes, which means
-- any temporary client-side ID never matches the row stored in the database.
--
-- This RPC wraps the INSERT in SECURITY DEFINER so the server can read back the
-- trigger-generated order_id even though the caller is anon. Returns the real
-- order_id, which the client uses to build tracking URLs and WhatsApp messages.
--
-- We retry on UNIQUE-constraint collisions (the trigger uses RANDOM()*10000 so
-- the keyspace is small and collisions, while rare, are possible).

CREATE OR REPLACE FUNCTION public.create_customer_order(
  p_customer_name   TEXT,
  p_phone           TEXT,
  p_address         TEXT,
  p_delivery_area   TEXT,
  p_delivery_charge NUMERIC,
  p_items           JSONB,
  p_subtotal        NUMERIC,
  p_discount_amount NUMERIC,
  p_coupon_code     TEXT,
  p_referral_code   TEXT,
  p_member_id       UUID,
  p_total           NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id TEXT;
  v_attempts INT := 0;
BEGIN
  LOOP
    v_attempts := v_attempts + 1;

    BEGIN
      INSERT INTO public.orders (
        order_id,        -- placeholder; trigger replaces it
        customer_name,
        phone,
        address,
        delivery_area,
        delivery_charge,
        items,
        subtotal,
        discount_amount,
        coupon_code,
        referral_code,
        member_id,
        total
      ) VALUES (
        'PENDING',
        p_customer_name,
        p_phone,
        p_address,
        p_delivery_area,
        COALESCE(p_delivery_charge, 0),
        COALESCE(p_items, '[]'::jsonb),
        p_subtotal,
        COALESCE(p_discount_amount, 0),
        p_coupon_code,
        p_referral_code,
        p_member_id,
        p_total
      )
      RETURNING order_id INTO v_order_id;

      -- Successful insert; bail out of the retry loop.
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        -- Collision on the random order_id — try again a few times.
        IF v_attempts >= 8 THEN
          RAISE;
        END IF;
    END;
  END LOOP;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_order(
  TEXT, TEXT, TEXT, TEXT, NUMERIC, JSONB, NUMERIC, NUMERIC, TEXT, TEXT, UUID, NUMERIC
) TO anon, authenticated;
