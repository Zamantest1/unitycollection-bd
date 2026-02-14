# Environment Variables & Supabase Credentials Setup

Quick start guide for configuring Supabase credentials following Vercel best practices.

## TL;DR - Quick Start

### For Local Development (5 minutes)

```bash
# 1. Copy template
cp .env.local.example .env.local

# 2. Edit with your Supabase credentials
# Get from: https://supabase.com/dashboard → Settings > API
nano .env.local

# 3. Add these values:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# 4. Verify setup
npm run verify-env

# 5. Start development
npm run dev
```

### For Vercel Production (5 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select: **unitycollection-bd**
3. Go to: **Settings > Environment Variables**
4. Add these 2 variables (select all environments):
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase anon key
5. Deploy: `git push` or `vercel --prod`

## What Was Fixed

Your Supabase credentials were exposed in the `.env` file. We've now:

1. ✅ Replaced hardcoded credentials with placeholders
2. ✅ Created `.env.local.example` template for safe local setup
3. ✅ Added automated verification script (`verify-env.js`)
4. ✅ Created comprehensive setup documentation
5. ✅ Integrated with Vercel best practices

## Files to Review

| File | Purpose | Read First? |
|------|---------|------------|
| **ENV_SETUP_CHECKLIST.md** | ⭐ Start here - step-by-step checklist | YES |
| **ENVIRONMENT_VARIABLES_SETUP.md** | Detailed setup guide with explanations | If unsure |
| **ENV_SECURITY_FIXES.md** | What was fixed and why | For context |
| **ENV_INTEGRATION_VERIFICATION.md** | Complete verification testing guide | After setup |
| `.env.local.example` | Template for local development | Reference |

## Quick Reference

### Local Development
- Create `.env.local` from `.env.local.example`
- Add your Supabase credentials
- Run `npm run verify-env`
- Start with `npm run dev`

### Production (Vercel)
- Add credentials to Vercel Dashboard
- Select all environments (Production, Preview, Development)
- Deploy as normal

### Troubleshooting
- Run `npm run verify-env` to check your setup
- Check `.env.local` file exists and has correct values
- Verify Vercel variables in Dashboard > Settings > Environment Variables
- Read `ENV_INTEGRATION_VERIFICATION.md` for detailed testing

## Key Points

- **Never commit** `.env` or `.env.local` files to git (already in `.gitignore`)
- **Use `VITE_` prefix** for frontend variables
- **Verify before deploying** with `npm run verify-env`
- **Get credentials from** https://supabase.com/dashboard → Settings > API
- **Use anon key**, not service_role key
- **Keep credentials secure** - never share via email/chat

## Next Steps

1. **Read**: [ENV_SETUP_CHECKLIST.md](./ENV_SETUP_CHECKLIST.md)
2. **Follow**: All checklist items
3. **Verify**: `npm run verify-env` passes
4. **Test**: `npm run dev` and check application works
5. **Deploy**: Follow Vercel section in checklist

## Support

- **Local setup questions**: See `ENVIRONMENT_VARIABLES_SETUP.md` → "For Local Development"
- **Production setup questions**: See `ENVIRONMENT_VARIABLES_SETUP.md` → "For Vercel Production Deployment"
- **Verification help**: See `ENV_INTEGRATION_VERIFICATION.md`
- **Security info**: See `ENV_SECURITY_FIXES.md`

---

**Status**: Ready for setup

**Last Updated**: February 2025

**Next**: Open [ENV_SETUP_CHECKLIST.md](./ENV_SETUP_CHECKLIST.md) and follow the checklist
