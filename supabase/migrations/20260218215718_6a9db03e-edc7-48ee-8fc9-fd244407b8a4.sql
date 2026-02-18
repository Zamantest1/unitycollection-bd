
-- Add product_code column
ALTER TABLE public.products ADD COLUMN product_code text;

-- Create trigger function to auto-generate product codes
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(product_code FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.products
    WHERE product_code IS NOT NULL;
    
    NEW.product_code := 'UC-P' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$function$;

-- Create trigger
CREATE TRIGGER generate_product_code_trigger
BEFORE INSERT ON public.products
FOR EACH ROW
WHEN (NEW.product_code IS NULL)
EXECUTE FUNCTION public.generate_product_code();

-- Backfill existing products with codes based on creation order
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    FOR rec IN SELECT id FROM public.products ORDER BY created_at ASC
    LOOP
        UPDATE public.products 
        SET product_code = 'UC-P' || LPAD(counter::TEXT, 4, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END;
$$;

-- Now make it unique and not null
ALTER TABLE public.products ALTER COLUMN product_code SET NOT NULL;
CREATE UNIQUE INDEX idx_products_product_code ON public.products(product_code);
