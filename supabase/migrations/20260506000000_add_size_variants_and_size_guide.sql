-- Adds per-size stock + a size-guide image URL to products.
-- size_stock is an arbitrary {size: count} map so admins can keep
-- the canonical sizes[] array as the source of truth for "what's
-- available" and use this map purely as a per-size inventory ledger.
-- stock_quantity stays as the authoritative total (computed in the
-- admin UI as sum(size_stock) when sizes[] is non-empty).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size_stock JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size_guide_url TEXT;

COMMENT ON COLUMN public.products.size_stock IS
  'Per-size stock breakdown, e.g. {"S": 4, "M": 10}. Empty when product has no size variants.';

COMMENT ON COLUMN public.products.size_guide_url IS
  'Optional URL to a size-chart image. Shown on the product detail page.';
