-- =============================================
-- ADMIN USER SETUP SCRIPT
-- This script sets up the initial admin user
-- Email: unitycollectionbd@gmail.com
-- Password: unitycollectionbd2024
-- =============================================

-- NOTE: This script requires manual intervention in Supabase dashboard:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter:
--    Email: unitycollectionbd@gmail.com
--    Password: unitycollectionbd2024
-- 4. Click "Create User"
-- 5. Copy the user ID that appears
-- 6. Replace 'USER_ID_HERE' below with the actual user ID
-- 7. Run this SQL in the SQL Editor

-- Add admin role to the user (replace USER_ID_HERE with actual user ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was added
SELECT user_id, role, created_at FROM public.user_roles 
WHERE role = 'admin';
