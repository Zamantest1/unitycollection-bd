# Admin User Setup

## Admin Credentials

**Email**: unitycollectionbd@gmail.com  
**Password**: unitycollectionbd2024

## How to Set Up Admin User

### Step 1: Create User in Supabase Auth

1. Go to your Supabase project dashboard
2. Click on **Authentication** in the left sidebar
3. Click on **Users** tab
4. Click **Add user** button
5. Select **Create new user**
6. Fill in the form:
   - **Email**: unitycollectionbd@gmail.com
   - **Password**: unitycollectionbd2024
   - **Auto Confirm user**: Toggle ON (so user is active immediately)
7. Click **Create user**
8. Copy the **User ID** that appears in the table

### Step 2: Assign Admin Role

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Replace `USER_ID_HERE` in the script below with the user ID from step 1
4. Run this SQL:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

5. You should see "1 rows affected" - the admin role is now assigned

### Step 3: Test Login

1. Go to `http://localhost:5173/admin/login` (or your deployment URL)
2. Enter:
   - **Email**: unitycollectionbd@gmail.com
   - **Password**: unitycollectionbd2024
3. Click **Sign In**
4. You should be redirected to the admin dashboard

## Admin Access

Once logged in, the admin can access:

- **Dashboard** - Overview of sales, orders, and products
- **Products** - Add, edit, delete products with images
- **Categories** - Manage product categories
- **Orders** - View and update order status
- **Coupons** - Create and manage discount codes
- **Members** - Manage loyalty program members
- **Referrals** - Configure referral programs
- **Banners** - Manage homepage banners
- **Notices** - Set announcement messages

## Security Notes

- Never share these credentials publicly
- Change the password after first login
- The admin email is only for authentication - it won't receive actual emails unless you configure SMTP
- User roles are stored in the `user_roles` table with RLS protection

## Troubleshooting

**Login fails with "Invalid login credentials"**
- Make sure the email and password are exactly as entered in Supabase
- Verify the user is "Auto Confirmed" in Supabase (status should be "Confirmed")

**Login succeeds but redirects to login page**
- The user doesn't have the admin role assigned
- Check the `user_roles` table to ensure the record exists with role = 'admin'

**Forgot password**
- Go back to Supabase dashboard → Authentication → Users
- Find the user and click the menu (three dots)
- Select "Reset password"
