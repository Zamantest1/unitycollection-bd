# Admin Login Credentials & Setup Guide

## Quick Start

### Admin Account Details
- **Email:** `unitycollectionbd@gmail.com`
- **Password:** `unitycollectionbd2024`
- **Access Level:** Admin (Full Dashboard Access)

---

## Setup Instructions

### Step 1: Verify Admin User in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `mnzeeudkyjgoezlsmwer`
3. Navigate to **Authentication → Users**
4. Verify that a user with email `unitycollectionbd@gmail.com` exists
5. If not, create the user:
   - Click **"Add user"**
   - Enter email: `unitycollectionbd@gmail.com`
   - Set password: `unitycollectionbd2024`
   - Confirm email (checkbox)
   - Click **"Save"**

### Step 2: Assign Admin Role

1. In Supabase, go to **SQL Editor**
2. Run this query to grant admin privileges:

```sql
-- Insert admin role for the user
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'unitycollectionbd@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

3. Verify the role was assigned by running:

```sql
SELECT user_id, role FROM user_roles 
WHERE role = 'admin';
```

### Step 3: Login to Admin Dashboard

1. Navigate to: `https://yourdomain.com/admin` (or local dev: `http://localhost:5173/admin`)
2. Enter credentials:
   - Email: `unitycollectionbd@gmail.com`
   - Password: `unitycollectionbd2024`
3. Click **"Sign In"**
4. You should be redirected to the Admin Dashboard

---

## Environment Variables

Ensure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://mnzeeudkyjgoezlsmwer.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0L6SQ0Zm6aZlmEW1G3748g_lXkAC0KI
```

**Note:** These are public keys and safe to commit to version control.

---

## Password Reset Process

### If You Forget Your Password

1. Go to the admin login page
2. Click **"Forgot Password"** (if available, or use Supabase auth)
3. Use Supabase dashboard to reset:
   - Go to **Authentication → Users**
   - Find your user
   - Click the three dots menu
   - Select **"Reset password"**
   - A reset link will be sent to the email

### To Change Your Password

1. Log in to the admin dashboard
2. Go to **Profile Settings** (if implemented)
3. Update your password
4. Or use Supabase dashboard directly

---

## Additional Admin Accounts

To create more admin accounts, follow the same setup steps:

1. Create user in Supabase Auth
2. Run the SQL command to assign admin role
3. Share credentials securely with team members

---

## Security Best Practices

### For Development
- Keep credentials in `.env` file (not committed to git)
- Use `.env.local` for local overrides
- Never share credentials in chat/email

### For Production
- Change the default admin password immediately
- Use strong, unique passwords
- Enable 2FA if available in your auth system
- Rotate passwords regularly
- Audit login activity
- Keep admin emails secure

### API Keys Security
- Public keys (VITE_* prefix) are safe in the browser
- Service role keys should NEVER be exposed in frontend code
- Keep service role keys only in backend/serverless functions

---

## Troubleshooting

### Login Fails with "Access denied"
- Verify user exists in Supabase Auth
- Confirm admin role is assigned in `user_roles` table
- Check RLS policies allow access

### "Missing Environment Variables"
- Verify `.env` file exists
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
- Restart dev server after changing `.env`

### Session Issues
- Clear browser cookies
- Clear localStorage
- Try incognito/private window
- Check browser console for errors

---

## Support

For issues, check:
1. Browser console for error messages
2. Network tab for failed requests
3. Supabase dashboard for auth logs
4. Application logs and error reports

Contact the development team with detailed error information.
