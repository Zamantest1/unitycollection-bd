# Deploying to Vercel - Step by Step

This guide walks you through deploying your Unity Collection app to Vercel.

## Prerequisites

- GitHub account with your code pushed
- Supabase project created
- Vercel account (free at https://vercel.com)

## Step 1: Get Your Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your project
3. Go to **Settings → API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Public Key** (under "Project API keys")

Keep these values handy - you'll need them in Vercel.

## Step 2: Create a Vercel Project

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Select "Import Git Repository"
4. Find and select your GitHub repository
5. Click "Import"

## Step 3: Configure Build Settings

Vercel should auto-detect these, but verify:

**Project Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (default)

## Step 4: Add Environment Variables ⚠️ CRITICAL STEP

1. In the Vercel project settings, click **Settings**
2. Go to **Environment Variables**
3. Add your Supabase credentials:

### Variable 1: Supabase URL
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://your-project.supabase.co` (from Step 1)
- **Select environments**: Production, Preview, Development

### Variable 2: Supabase Anon Key
- **Name**: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Value**: Your anon key (from Step 1)
- **Select environments**: Production, Preview, Development

**Example screenshot layout:**
```
NAME                              VALUE                              ENVIRONMENTS
VITE_SUPABASE_URL                https://xxxxx.supabase.co          ✓ Production ✓ Preview ✓ Development
VITE_SUPABASE_PUBLISHABLE_KEY     eyJhbGc...                         ✓ Production ✓ Preview ✓ Development
```

4. Click "Save" after adding each variable

## Step 5: Deploy

### Option A: Automatic Deployment
- Once you've added environment variables, click "Deploy" or push to your main branch
- Vercel will automatically build and deploy

### Option B: Redeploy Existing Project
1. If the project is already deployed
2. Go to **Deployments** tab
3. Click the three dots on the latest deployment
4. Select "Redeploy"

## Step 6: Verify Deployment

1. Once deployment finishes, click "Visit" to go to your live site
2. Test key features:
   - Can you see products?
   - Can you add items to cart?
   - Can you create orders?

### Verify Supabase Connection
If you added the `SupabaseConnectionTest` component to a page, it should show:
- ✓ Connected to Supabase successfully!

## Troubleshooting

### Deployment fails with "Missing VITE_SUPABASE_URL"

**Problem**: Environment variables weren't set before deployment.

**Solution**:
1. Go to Vercel project settings
2. Add the environment variables (see Step 4 above)
3. Redeploy the project

### Build succeeds but app shows "Connection failed"

**Problem**: Wrong environment variable values.

**Solution**:
1. Verify values are correct in Vercel settings
2. Check they match exactly what's in Supabase dashboard
3. Make sure you copied the full URL and key
4. Redeploy after fixing

### "Cannot find module @supabase/supabase-js"

**Problem**: npm didn't install dependencies.

**Solution**:
1. Check that build command is `npm run build`
2. Check that install command is `npm install`
3. Trigger a redeploy
4. Check build logs for errors

## After Deployment

### Monitor Your Application
1. In Vercel dashboard, go to your project
2. Click **Analytics** to monitor performance
3. Check **Logs** if there are any runtime errors

### Update Environment Variables Later
1. Go to **Settings → Environment Variables**
2. Click the variable to edit it
3. Update the value
4. Vercel will ask if you want to redeploy
5. Click "Redeploy" to apply changes

### Custom Domain (Optional)
1. Go to **Settings → Domains**
2. Click "Add Domain"
3. Enter your domain
4. Follow DNS configuration instructions

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key for frontend access | `eyJhbGc...` |

**Important**: 
- The `VITE_` prefix is required for Vite to expose these to the frontend
- Only the Anon key should be exposed to frontend code
- Never expose the Service Role key

## Common Deployment Issues

### Issue: Build times out
- Your project is too large or has slow dependencies
- Solution: Optimize images, remove unused packages, or upgrade Vercel plan

### Issue: Build succeeds but site is blank/shows 404
- Your build output directory might be wrong
- Solution: Verify output directory is `dist` in build settings

### Issue: Database connection works locally but not on Vercel
- Vercel's IP might need to be whitelisted in Supabase
- Solution: Go to Supabase Settings → Network, add Vercel IP to allowlist

## Success Checklist

- [ ] Environment variables added to Vercel
- [ ] Deployment succeeded (green checkmark)
- [ ] Site is accessible at Vercel domain
- [ ] Supabase connection works
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Orders can be created

## Next Steps

1. **Set up automatic deployments** from your GitHub main branch
2. **Add custom domain** if you have one
3. **Enable Supabase logging** to monitor database activity
4. **Set up alerts** for deployment failures

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Integration**: https://vercel.com/docs/concepts/git
- **Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables

---

**Remember**: After adding environment variables to Vercel, you MUST redeploy for changes to take effect!
