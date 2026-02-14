# Environment Variables Setup Checklist

Complete these steps to properly configure your Supabase credentials for the Unity Collection application.

## For Local Development

- [ ] Copy `.env.local.example` to `.env.local`
  ```bash
  cp .env.local.example .env.local
  ```

- [ ] Get Supabase credentials from https://supabase.com/dashboard
  - [ ] Navigate to your project
  - [ ] Go to Settings > API
  - [ ] Copy your Project URL
  - [ ] Copy your Anon Public Key

- [ ] Update `.env.local` with your credentials
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
  ```

- [ ] Verify environment setup
  ```bash
  npm run verify-env
  ```

- [ ] Start development server
  ```bash
  npm run dev
  ```

- [ ] Test Supabase connection by navigating to a page that uses Supabase

## For Vercel Production Deployment

- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)

- [ ] Select your project: **unitycollection-bd**

- [ ] Go to **Settings > Environment Variables**

- [ ] Add these variables:

  **Variable 1: VITE_SUPABASE_URL**
  - [ ] Name: `VITE_SUPABASE_URL`
  - [ ] Value: `https://your-project.supabase.co`
  - [ ] Environments: Select Production, Preview, Development
  - [ ] Click Add

  **Variable 2: VITE_SUPABASE_PUBLISHABLE_KEY**
  - [ ] Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
  - [ ] Value: Your Supabase Anon Public Key
  - [ ] Environments: Select Production, Preview, Development
  - [ ] Click Add

- [ ] Verify variables are saved (they should appear in the list)

- [ ] Trigger a new deployment
  ```bash
  git push
  # or
  vercel --prod
  ```

- [ ] Monitor deployment logs for any environment variable errors

- [ ] Test the deployed application

## Verification Commands

```bash
# Verify all environment variables are configured
npm run verify-env

# Check if specific variable exists
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_PUBLISHABLE_KEY

# Pull latest environment variables from Vercel (requires Vercel CLI)
vercel env pull

# Deploy to Vercel
vercel --prod
```

## Security Reminders

- Never commit `.env` or `.env.local` files
- Never share credentials via email or chat
- Rotate credentials regularly if compromised
- Use different credentials for development vs production (optional but recommended)
- Keep `.gitignore` updated to exclude environment files

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Missing VITE_SUPABASE_URL" error | Check `.env.local` exists and has correct value |
| Variables not loading in dev | Restart dev server after updating `.env.local` |
| Build fails on Vercel | Verify variables added to Vercel Environment Variables |
| "Permission denied" in Supabase | Ensure you're using the anon key, not the service role key |

## Files Reference

| File | Purpose | Commit? |
|------|---------|---------|
| `.env.local.example` | Template for local setup | ✅ Yes |
| `.env.local` | Your local credentials | ❌ No (.gitignore) |
| `.env` | Template with placeholders | ✅ Yes |
| `ENVIRONMENT_VARIABLES_SETUP.md` | Detailed setup guide | ✅ Yes |
| `ENV_SETUP_CHECKLIST.md` | This file | ✅ Yes |
| `verify-env.js` | Verification script | ✅ Yes |

## Next Steps

1. Complete the Local Development section above
2. Test with `npm run dev`
3. Complete the Vercel Deployment section
4. Verify production deployment works

For detailed information, see [ENVIRONMENT_VARIABLES_SETUP.md](./ENVIRONMENT_VARIABLES_SETUP.md)
