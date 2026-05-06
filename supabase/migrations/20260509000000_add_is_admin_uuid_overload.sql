-- Add a `public.is_admin(p_user_id UUID)` overload.
--
-- The original `is_admin()` (no args) was created in
-- 20260126174753_fbc2ca1a-….sql and reads `auth.uid()` itself.
-- Several later migrations — notably the abandoned-order RPCs in
-- 20260507000000_abandoned_order_recovery.sql and the patched cancel
-- RPCs in 20260507180000_fix_cancel_rpc_order_id_type.sql — call
-- `public.is_admin(auth.uid())` with an explicit UUID argument.
--
-- Postgres treats `is_admin()` and `is_admin(uuid)` as different
-- functions (overloading), so any RPC that uses the latter blew up
-- with:
--
--   ERROR: function public.is_admin(uuid) does not exist
--
-- This migration adds the overload so those RPCs work.  Behaviour is
-- identical to the no-arg version when the supplied UUID equals the
-- current auth.uid().

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
