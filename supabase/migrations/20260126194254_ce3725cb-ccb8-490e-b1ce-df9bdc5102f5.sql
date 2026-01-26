-- Create members table for membership system
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

-- Create settings table for global config
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add member_id to orders table
ALTER TABLE public.orders ADD COLUMN member_id UUID REFERENCES public.members(id);

-- Enable RLS on members table
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- RLS policies for members
CREATE POLICY "Admins can manage members" ON public.members
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active members for validation" ON public.members
FOR SELECT USING ((is_active = true) OR is_admin());

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for settings
CREATE POLICY "Admins can manage settings" ON public.settings
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Anyone can view settings" ON public.settings
FOR SELECT USING (true);

-- Create trigger for member updated_at
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for settings updated_at
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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

-- Trigger for auto-generating member code
CREATE TRIGGER generate_member_code_trigger
    BEFORE INSERT ON public.members
    FOR EACH ROW
    WHEN (NEW.member_code IS NULL OR NEW.member_code = '')
    EXECUTE FUNCTION public.generate_member_code();

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
('membership_threshold', '{"amount": 5000}'::jsonb),
('default_member_discount', '{"value": 5, "type": "percentage"}'::jsonb);

-- Insert sample banners
INSERT INTO public.banners (title, subtitle, image_url, link, overlay_type, display_order, is_active) VALUES
('Premium Punjabi Collection', 'Elevate your style with our exclusive designs', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&q=80', '/shop', 'green', 1, true),
('Eid Special Sale', 'Up to 30% off on selected items', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1920&q=80', '/shop', 'gold', 2, true),
('New Arrivals', 'Discover the latest trends in traditional wear', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1920&q=80', '/shop', 'none', 3, true);