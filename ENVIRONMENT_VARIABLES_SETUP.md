# Environment Variables Setup Guide

This guide explains how to properly configure environment variables for the Unity Collection application on Vercel and for local development.

## Overview

Environment variables are used to securely manage sensitive configuration data like API keys and database credentials. This application uses **Supabase** for backend services.

### Variable Types
- **Public Variables**: `VITE_*` prefix - Safe to expose in frontend (Supabase URL and Anon Key)
- **Private Variables**: `PRIVATE_*` prefix - Server-side only (if needed in future)

## For Vercel Production Deployment

### Step 1: Access Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **unitycollection-bd**
3. Navigate to **Settings > Environment Variables**

### Step 2: Add Supabase Variables

Add the following environment variables with values from your Supabase project:

| Variable Name | Value | Environments |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key | Production, Preview, Development |

### Step 3: How to Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy these values:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **Anon public key** → Use for `VITE_SUPABASE_PUBLISHABLE_KEY`

### Step 4: Apply to Deployments

- **Production**: Applies to `main` branch deployments
- **Preview**: Applies to pull request deployments
- **Development**: For local development with `vercel dev`

After adding variables, new deployments will use them automatically.

## For Local Development

### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Pull environment variables from your Vercel project
vercel env pull

# This creates a .env file with your Development environment variables
```

### Option 2: Manual Setup

1. Create a `.env.local` file in your project root:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

3. Never commit `.env.local` to version control (it's already in `.gitignore`)

## Security Best Practices

### ✅ DO
- Store sensitive credentials in Vercel environment variables or `.env.local`
- Use different credentials for development and production if possible
- Rotate credentials regularly
- Keep `.env.local` in `.gitignore` (already configured)
- Use `.env.example` as a template for team members

### ❌ DON'T
- Commit `.env` or `.env.local` files to git
- Share credentials via email or chat
- Use production credentials in development
- Log or expose environment variables in error messages
- Hardcode credentials directly in source code

## Environment Variable Size Limits

- **Standard runtimes** (Node.js, Python, Go, Ruby): Up to 64 KB total
- **Edge Functions/Middleware**: Up to 5 KB per variable
- No single variable can exceed its environment limit

## Troubleshooting

### Variables Not Loading
1. Ensure you're using the correct prefix: `VITE_` for frontend variables
2. Check spelling - environment variable names are case-sensitive
3. Restart your dev server after changing `.env.local`
4. Run `vercel env pull` to sync from Vercel

### "Missing VITE_SUPABASE_URL" Error
1. Verify the variable is set in your `.env.local` or Vercel project
2. Check the project URL format: `https://xxx.supabase.co`
3. Restart your development server

### Build Fails After Deployment
1. Verify all variables are added to Vercel's Production environment
2. Check that variable names match exactly (case-sensitive)
3. Deploy again after adding variables (new deployments needed)

## File Structure Reference

```
project-root/
├── .env                    ← Template (do not edit, uses placeholders)
├── .env.local              ← YOUR LOCAL VALUES (add to .gitignore)
├── .env.local.example      ← Example template for team
├── .env.example            ← Original example
├── .gitignore              ← Should include .env.local
└── src/
    └── integrations/
        └── supabase/
            └── client.ts   ← Loads variables at startup
```

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Environment Variables for Local Development](https://vercel.com/docs/environment-variables/environment-variables-for-local-development)

## Quick Reference: Adding New Variables

When you need to add new environment variables:

1. **Update .env.local.example**: Add with placeholder value
2. **Add to Vercel**: Settings > Environment Variables
3. **Select environments**: Choose Production/Preview/Development
4. **Update code**: Reference with `import.meta.env.VITE_VARIABLE_NAME`
5. **Redeploy**: New deployments will have access

## Next Steps

1. ✅ Ensure your Supabase credentials are added to Vercel
2. ✅ Set up `.env.local` for local development
3. ✅ Test the connection with `vercel dev`
4. ✅ Deploy: `vercel --prod`
