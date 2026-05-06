-- Add display_order to public.categories so admins can manually
-- arrange how categories appear on the storefront and admin grids.
--
-- Existing rows default to 0 and are sorted alphabetically as a
-- secondary key, so behaviour is unchanged until the admin starts
-- reordering.  The admin UI uses two RPCs — none here; reordering is
-- a plain `UPDATE … SET display_order = X` against this column.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS categories_display_order_idx
  ON public.categories (display_order, name);
