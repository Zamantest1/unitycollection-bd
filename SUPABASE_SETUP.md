# Supabase Setup Guide

This document explains how to configure Supabase for the Unity Collection project.

## Local Development Setup

### 1. Get Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings → API**
4. Copy the following values:
   - **Project URL** (under "Project URLs")
   - **Anon Public Key** (under "Project API keys")

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

3. **IMPORTANT**: Never commit `.env` to version control. It's already in `.gitignore`.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### 5. Test Supabase Connection

Add the `<SupabaseConnectionTest />` component to any page to verify the connection:

```tsx
import { SupabaseConnectionTest } from '@/components/SupabaseConnectionTest';

export function YourPage() {
  return (
    <div>
      <SupabaseConnectionTest />
      {/* rest of your page */}
    </div>
  );
}
```

## Vercel Deployment Setup

### 1. Connect Your GitHub Repository

1. Push your code to GitHub
2. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
3. Click "New Project" and import your GitHub repository

### 2. Add Environment Variables to Vercel

1. In your Vercel project settings, go to **Settings → Environment Variables**
2. Add these variables:
   - Key: `VITE_SUPABASE_URL`
     - Value: Your Supabase URL (e.g., `https://your-project.supabase.co`)
   
   - Key: `VITE_SUPABASE_PUBLISHABLE_KEY`
     - Value: Your Supabase anon key

3. Make sure to select the correct environment (Production, Preview, Development)

### 3. Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (default)

### 4. Deploy

1. Push your changes to GitHub
2. Vercel will automatically build and deploy
3. Your app will be available at your Vercel domain

## Security Best Practices

### Environment Variables

- ✅ **Safe to expose in frontend**: `VITE_SUPABASE_ANON_KEY` (Anon key is public)
- ❌ **Never expose**: Service role key, database passwords, API secrets
- ❌ **Never commit**: `.env` file to version control

### Database Security

- Row Level Security (RLS) is enabled on all tables
- Use `is_admin()` function to check admin permissions
- Create RLS policies for sensitive operations

### Image Storage

- Product images are stored in Supabase Storage
- Public bucket with restricted write access (admins only)
- Images can be uploaded via the Admin panel

## Troubleshooting

### "Missing VITE_SUPABASE_URL environment variable"

**Solution**: Add the environment variable to `.env` (local) or to Vercel project settings (production)

### Connection test fails but credentials look correct

1. Verify the URL format is exactly: `https://xxxxx.supabase.co`
2. Check that the anon key is not truncated
3. Ensure Supabase project is not paused
4. Check browser console for CORS errors

### Database tables not found

1. Run migrations in Supabase:
   ```bash
   supabase db push
   ```
2. Or manually execute SQL from `scripts/setup-supabase.sql`

## Using the Supabase Client in Your Code

### Simple Import

```tsx
import { supabase } from '@/lib/supabase';

// Fetch products
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);
```

### With Type Safety

```tsx
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Product = Database['public']['Tables']['products']['Row'];

const products: Product[] = data || [];
```

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- Check the browser console for detailed error messages
- Use the `SupabaseConnectionTest` component to diagnose connection issues
