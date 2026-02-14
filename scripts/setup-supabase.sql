-- =============================================
-- UNITY COLLECTION SUPABASE BACKEND SETUP
-- Complete database schema migration
-- =============================================

-- Create app_role enum for admin management
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User Roles Table (for admin access)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sizes TEXT[] DEFAULT '{}',
    image_urls TEXT[] DEFAULT '{}',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    sold_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT stock_quantity_non_negative CHECK (stock_quantity >= 0)
);

-- Banners Table
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    link TEXT,
    overlay_type TEXT DEFAULT 'green' CHECK (overlay_type IN ('green', 'gold', 'none')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notice Settings Table
CREATE TABLE public.notice_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coupons Table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    delivery_area TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    coupon_code TEXT,
    total DECIMAL(10,2) NOT NULL,
    referral_code TEXT,
    member_id UUID,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referrals Table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('fixed', 'percentage')),
    commission_value NUMERIC NOT NULL CHECK (commission_value >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Members Table
CREATE TABLE public.members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    member_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    email TEXT,
    total_purchases NUMERIC NOT NULL DEFAULT 0,
    order_count INTEGER NOT NULL DEFAULT 0,
    discount_value NUMERIC NOT NULL DEFAULT 5,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Settings Table
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add member_id reference to orders
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_members 
FOREIGN KEY (member_id) REFERENCES public.members(id);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to check admin role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- RLS POLICIES
-- =============================================

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for banners
CREATE POLICY "Anyone can view active banners"
ON public.banners FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage banners"
ON public.banners FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for notice_settings
CREATE POLICY "Anyone can view active notices"
ON public.notice_settings FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage notices"
ON public.notice_settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for coupons
CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for referrals
CREATE POLICY "Anyone can view active referrals"
ON public.referrals FOR SELECT
USING ((is_active = true) OR public.is_admin());

CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for members
CREATE POLICY "Admins can manage members"
ON public.members FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view active members for validation"
ON public.members FOR SELECT
USING ((is_active = true) OR public.is_admin());

-- RLS Policies for orders
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
USING (public.is_admin());

-- RLS Policies for settings
CREATE POLICY "Admins can manage settings"
ON public.settings FOR ALL
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can view settings"
ON public.settings FOR SELECT
USING (true);

-- =============================================
-- TRIGGERS FOR TIMESTAMPS
-- =============================================

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notice_settings_updated_at
BEFORE UPDATE ON public.notice_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-GENERATION FUNCTIONS
-- =============================================

-- Function to generate unique order ID
CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_id = 'UC-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to generate unique member code
CREATE OR REPLACE FUNCTION public.generate_member_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(member_code FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.members;
    
    NEW.member_code := 'UC-M' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- STOCK MANAGEMENT FUNCTIONS
-- =============================================

-- Function to decrease stock on order creation
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
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    product_id := (item->>'product_id')::UUID;
    quantity := COALESCE((item->>'quantity')::INTEGER, 1);
    
    UPDATE public.products
    SET 
      stock_quantity = stock_quantity - quantity,
      sold_count = sold_count + quantity
    WHERE id = product_id AND stock_quantity >= quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', product_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Function to restore stock from order deletion or return
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
  FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
  LOOP
    product_id := (item->>'product_id')::UUID;
    quantity := COALESCE((item->>'quantity')::INTEGER, 1);
    
    UPDATE public.products
    SET 
      stock_quantity = stock_quantity + quantity,
      sold_count = GREATEST(sold_count - quantity, 0)
    WHERE id = product_id;
  END LOOP;
  
  RETURN OLD;
END;
$$;

-- Function to handle order status change to returned
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
  IF NEW.status = 'returned' AND OLD.status != 'returned' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id := (item->>'product_id')::UUID;
      quantity := COALESCE((item->>'quantity')::INTEGER, 1);
      
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

-- =============================================
-- STOCK MANAGEMENT TRIGGERS
-- =============================================

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

-- =============================================
-- AUTO-GENERATION TRIGGERS
-- =============================================

CREATE TRIGGER set_order_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_id();

CREATE TRIGGER generate_member_code_trigger
BEFORE INSERT ON public.members
FOR EACH ROW
WHEN (NEW.member_code IS NULL OR NEW.member_code = '')
EXECUTE FUNCTION public.generate_member_code();

-- =============================================
-- STORAGE SETUP
-- =============================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
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

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
('membership_threshold', '{"amount": 5000}'::jsonb),
('default_member_discount', '{"value": 5, "type": "percentage"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample banners
INSERT INTO public.banners (title, subtitle, image_url, link, overlay_type, display_order, is_active) VALUES
('Premium Punjabi Collection', 'Elevate your style with our exclusive designs', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&q=80', '/shop', 'green', 1, true),
('Eid Special Sale', 'Up to 30% off on selected items', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1920&q=80', '/shop', 'gold', 2, true),
('New Arrivals', 'Discover the latest trends in traditional wear', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1920&q=80', '/shop', 'none', 3, true)
ON CONFLICT DO NOTHING;
