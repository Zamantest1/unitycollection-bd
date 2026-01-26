-- Add overlay_type column to banners table
ALTER TABLE banners 
ADD COLUMN overlay_type text DEFAULT 'green' 
CHECK (overlay_type IN ('green', 'gold', 'none'));