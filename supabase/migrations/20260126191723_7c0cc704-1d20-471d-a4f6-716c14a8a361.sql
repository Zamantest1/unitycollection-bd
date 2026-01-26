-- =============================================
-- PHASE 1: Complete Database Migration
-- =============================================

-- 1. Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.is_admin());

-- 2. Add stock columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_count INTEGER NOT NULL DEFAULT 0;

-- Add constraint to prevent negative stock
ALTER TABLE public.products
ADD CONSTRAINT stock_quantity_non_negative CHECK (stock_quantity >= 0);

-- 3. Add referral_code to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- 4. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('fixed', 'percentage')),
  commission_value NUMERIC NOT NULL CHECK (commission_value >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Anyone can view active referrals"
ON public.referrals FOR SELECT
USING ((is_active = true) OR is_admin());

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Trigger for updated_at on referrals
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create function to decrease stock on order creation
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  product_id UUID;
  quantity INTEGER;
BEGIN
  -- Parse items from order
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    product_id := (item->>'product_id')::UUID;
    quantity := COALESCE((item->>'quantity')::INTEGER, 1);
    
    -- Decrease stock and increase sold count
    UPDATE public.products
    SET 
      stock_quantity = stock_quantity - quantity,
      sold_count = sold_count + quantity
    WHERE id = product_id AND stock_quantity >= quantity;
    
    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', product_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 6. Create function to restore stock (for delete/return)
CREATE OR REPLACE FUNCTION public.restore_stock_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  product_id UUID;
  quantity INTEGER;
BEGIN
  -- Parse items from order
  FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
  LOOP
    product_id := (item->>'product_id')::UUID;
    quantity := COALESCE((item->>'quantity')::INTEGER, 1);
    
    -- Restore stock and decrease sold count
    UPDATE public.products
    SET 
      stock_quantity = stock_quantity + quantity,
      sold_count = GREATEST(sold_count - quantity, 0)
    WHERE id = product_id;
  END LOOP;
  
  RETURN OLD;
END;
$$;

-- 7. Create function to handle order status change to returned
CREATE OR REPLACE FUNCTION public.handle_order_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  product_id UUID;
  quantity INTEGER;
BEGIN
  -- Only trigger when status changes to 'returned'
  IF NEW.status = 'returned' AND OLD.status != 'returned' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id := (item->>'product_id')::UUID;
      quantity := COALESCE((item->>'quantity')::INTEGER, 1);
      
      -- Restore stock and decrease sold count
      UPDATE public.products
      SET 
        stock_quantity = stock_quantity + quantity,
        sold_count = GREATEST(sold_count - quantity, 0)
      WHERE id = product_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Create triggers for stock management
CREATE TRIGGER decrease_stock_on_order_insert
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.decrease_stock_on_order();

CREATE TRIGGER restore_stock_on_order_delete
BEFORE DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_stock_from_order();

CREATE TRIGGER handle_order_return_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_return();

-- 9. Add DELETE policy for orders (admins only)
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
USING (is_admin());