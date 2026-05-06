-- Add the missing `notes` column on public.orders.
--
-- The cancel_pending_order / admin_cancel_pending_order RPCs (created
-- in 20260507000000_abandoned_order_recovery.sql and patched in
-- 20260507180000_fix_cancel_rpc_order_id_type.sql) write a timestamped
-- audit line to `orders.notes` whenever an order is cancelled.  Those
-- migrations forgot to actually create the column, so every cancel —
-- whether from the customer "Back to shop" flow on /payment/:id or
-- from the admin Abandoned Orders page — fails with:
--
--   ERROR: column "notes" does not exist
--
-- Adding it as nullable TEXT so historical rows stay untouched; the
-- RPCs already use COALESCE(notes, '') before appending.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS notes TEXT;
