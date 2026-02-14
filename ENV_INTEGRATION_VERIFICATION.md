# Environment Variables Integration Verification

## Overview

This document guides you through verifying that your environment variables are correctly configured and that Supabase connection works properly.

## Pre-Setup Verification

Run these checks before starting:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version (should be 9+)
npm --version

# Verify git is clean
git status

# Verify .env.local is in .gitignore
cat .gitignore | grep "env.local"
```

**Expected Output**:
- Node.js: v18.x.x or higher
- npm: 9.x.x or higher
- .gitignore contains `.env.local`

## Step 1: Local Environment Setup

### 1.1 Create Local Environment File

```bash
# Navigate to project root
cd /path/to/unitycollection-bd

# Copy template to .env.local
cp .env.local.example .env.local

# Verify file was created
ls -la .env.local
```

**Expected Output**: `.env.local` file exists

### 1.2 Add Supabase Credentials

```bash
# Edit the file with your editor
nano .env.local
# OR
code .env.local
# OR
vim .env.local
```

**Update these values** from https://supabase.com/dashboard:

```env
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-actual-key-here
```

### 1.3 Verify File Contents

```bash
# Display (safely, without exposing real values in terminal history)
cat .env.local | grep VITE_SUPABASE
```

**Expected Output**:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Step 2: Automated Verification

### 2.1 Run Environment Check

```bash
npm run verify-env
```

**Expected Output**:
```
🔍 Verifying Environment Variables Setup...

📁 Configuration Files:
   ✅ .env.local (found)
   ✅ .env (found)

🔐 Required Variables:
   ✅ VITE_SUPABASE_URL
   ✅ VITE_SUPABASE_PUBLISHABLE_KEY

============================================================

✅ SUCCESS: All required environment variables are configured!
```

**If you get errors**:
- Check `.env.local` exists: `ls -la .env.local`
- Check file contents: `cat .env.local`
- Verify variable names (case-sensitive)
- Ensure no leading/trailing spaces

### 2.2 Manual Variable Check

```bash
# Check each variable individually
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_PUBLISHABLE_KEY: $VITE_SUPABASE_PUBLISHABLE_KEY"
```

**Expected Output**:
```
VITE_SUPABASE_URL: https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY: sb_publishable_...
```

## Step 3: Supabase Connection Test

### 3.1 Start Development Server

```bash
npm run dev
```

**What happens**:
1. `verify-env.js` runs automatically (should pass)
2. Vite starts dev server on http://localhost:8080
3. Supabase client initializes

**Watch for errors in console**:
- ✅ No error messages about missing variables
- ✅ "VITE_SUPABASE_URL" should not appear in error logs
- ✅ "VITE_SUPABASE_PUBLISHABLE_KEY" should not appear in error logs

### 3.2 Check Browser Console

Open http://localhost:8080 in your browser:

```javascript
// In browser DevTools Console (F12), check if client initialized
// If no errors about missing VITE_SUPABASE_*, you're good!
```

**Expected**:
- No red errors about environment variables
- Page loads successfully
- No 401/403 Supabase errors on first page load

### 3.3 Test a Feature Using Supabase

Navigate to a page that uses Supabase (e.g., Admin login, Products page):

- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] No "Failed to authenticate" messages
- [ ] Browser console shows no Supabase errors

## Step 4: Production Build Test

### 4.1 Build for Production

```bash
npm run build
```

**Expected Output**:
- Build completes successfully
- No warnings about missing environment variables
- Output folder created: `dist/`

**If build fails**:
```bash
# Check what went wrong
npm run build 2>&1 | tail -20
```

### 4.2 Preview Production Build

```bash
npm run preview
```

**Visit**: http://localhost:4173 (or shown in terminal)

**Test**:
- [ ] All pages load
- [ ] Supabase features work
- [ ] No console errors
- [ ] Application functions normally

## Step 5: Vercel Deployment Setup

### 5.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 5.2 Link Project

```bash
vercel link
```

**Follow prompts**:
- Select your Vercel account
- Confirm project: unitycollection-bd
- Link successful ✅

### 5.3 Add Environment Variables to Vercel

```bash
# Option 1: Use CLI (recommended)
vercel env add VITE_SUPABASE_URL
# Enter your Supabase URL when prompted
# Select: Production, Preview, Development

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
# Enter your Supabase anon key when prompted
# Select: Production, Preview, Development
```

**Option 2: Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select: unitycollection-bd
3. Settings > Environment Variables
4. Add both variables with all environments selected

### 5.4 Verify Vercel Variables

```bash
vercel env ls
```

**Expected Output**:
```
Environment Variables for project unitycollection-bd (...)
Preview and Production

VITE_SUPABASE_URL          (Previews, Production)
VITE_SUPABASE_PUBLISHABLE_KEY  (Previews, Production)
```

### 5.5 Deploy to Vercel

```bash
# Option 1: Deploy current branch (Preview)
vercel

# Option 2: Deploy to Production
vercel --prod
```

**Monitor deployment**:
- [ ] Build succeeds
- [ ] No environment variable errors
- [ ] Deployment completes
- [ ] Visit deployed URL

### 5.6 Test Production Deployment

Visit your production URL:
- [ ] Application loads
- [ ] All features work
- [ ] No Supabase errors
- [ ] Data persists/displays correctly

## Troubleshooting Guide

### Issue: "Missing VITE_SUPABASE_URL"

**Solution**:
```bash
# 1. Verify .env.local exists
ls .env.local

# 2. Check file contents
cat .env.local

# 3. Verify variable name (case-sensitive!)
# Should be: VITE_SUPABASE_URL (not VITE_supabase_url)

# 4. Restart dev server
# Stop dev server (Ctrl+C)
npm run dev
```

### Issue: Build Succeeds Locally but Fails on Vercel

**Solution**:
```bash
# 1. Verify variables in Vercel Dashboard
# Settings > Environment Variables

# 2. Re-add variables (sometimes they need re-saving)
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY

# 3. Redeploy
vercel --prod
```

### Issue: Application Works Locally but Not on Vercel

**Solution**:
1. Check if variables are in all needed environments (Production, Preview, Development)
2. Check variable values match exactly (including case)
3. Check for typos in Supabase URL and key
4. In Vercel logs, search for "VITE_SUPABASE" to see if variables loaded

### Issue: Supabase Connection Errors

**Solution**:
```bash
# 1. Verify URL format
echo $VITE_SUPABASE_URL
# Should be: https://your-project.supabase.co (with .co not .co/)

# 2. Verify key type (must be anon, not service_role)
echo $VITE_SUPABASE_PUBLISHABLE_KEY
# Should start with: sb_publishable_

# 3. Check Supabase project is active
# Visit: https://supabase.com/dashboard

# 4. Check browser console for specific error message
```

## Verification Checklist

Before considering setup complete:

- [ ] `.env.local` file exists
- [ ] `.env.local` contains correct Supabase credentials
- [ ] `.env.local` is in `.gitignore`
- [ ] `npm run verify-env` passes
- [ ] `npm run dev` starts without env errors
- [ ] Application loads in browser
- [ ] Supabase features work (auth, database, etc.)
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works
- [ ] Variables added to Vercel Dashboard
- [ ] Deployment to Vercel succeeds
- [ ] Deployed application works correctly
- [ ] No console errors on any environment

## Documentation References

| Document | Purpose |
|----------|---------|
| `ENVIRONMENT_VARIABLES_SETUP.md` | Detailed setup guide |
| `ENV_SETUP_CHECKLIST.md` | Quick reference checklist |
| `ENV_SECURITY_FIXES.md` | Security improvements made |
| `ENV_INTEGRATION_VERIFICATION.md` | This document |

## Support Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Vercel Troubleshooting](https://vercel.com/docs/concepts/error-explanations)
- [Supabase Documentation](https://supabase.com/docs)

---

**Status**: Ready for environment variable verification

**Next Step**: Follow the steps above in order, starting with "Step 1: Local Environment Setup"
