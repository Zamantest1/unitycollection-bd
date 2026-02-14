# Deployment Guide

**Unity Collection - Production Deployment**

---

## Table of Contents
1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Environment Configuration](#environment-configuration)
3. [Build & Testing](#build--testing)
4. [Deployment to Vercel](#deployment-to-vercel)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Support](#monitoring--support)

---

## Pre-Deployment Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone https://github.com/Zamantest1/unitycollection-bd.git
cd unitycollection-bd

# Install dependencies
npm install
# or if using pnpm: pnpm install
# or if using yarn: yarn install
```

### 2. Verify Node.js Version

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version
```

### 3. Create Supabase Project

If not already done:
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Note the Project URL and Anon Key
4. Initialize database schema (see below)

---

## Environment Configuration

### 1. Local Development

Create `.env` file with development credentials:

```env
# Supabase (Development)
VITE_SUPABASE_URL=https://mnzeeudkyjgoezlsmwer.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0L6SQ0Zm6aZlmEW1G3748g_lXkAC0KI
```

### 2. Production Environment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add the following variables:

```
VITE_SUPABASE_URL=https://mnzeeudkyjgoezlsmwer.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_0L6SQ0Zm6aZlmEW1G3748g_lXkAC0KI
```

**Note:** These are public keys (VITE prefix), safe to expose.

### 3. Database Schema

Initialize Supabase tables by running migrations. Check `supabase/migrations/` or use:

```bash
# Via Supabase CLI (if installed)
supabase db push

# Or manually via Supabase dashboard → SQL Editor
```

### 4. Admin User Setup

Run this SQL in Supabase SQL Editor:

```sql
-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'unitycollectionbd@gmail.com',
  crypt('unitycollectionbd2024', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Assign admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'unitycollectionbd@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

---

## Build & Testing

### 1. Local Testing

```bash
# Start development server
npm run dev

# Visit http://localhost:5173

# Test key features:
# - Admin login: /admin
# - Shop page: /shop
# - Cart and checkout
# - Product management (if admin)
```

### 2. Production Build

```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview

# Visit http://localhost:4173
```

### 3. Verify Build Output

```bash
# Check dist folder is created
ls -la dist/

# Typical structure:
# dist/
# ├── index.html
# ├── assets/
# │   ├── index-xxx.js
# │   ├── index-xxx.css
# │   └── [other assets]
```

### 4. Run Tests (if available)

```bash
# Run test suite
npm run test

# Watch mode for development
npm run test:watch
```

---

## Deployment to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Import the project

2. **Configure Build Settings**
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all variables from `.env`
   - Apply to Production environment

4. **Deploy**
   - Push changes to `main` branch
   - Vercel automatically builds and deploys
   - Monitor deployment status in Vercel dashboard

### Method 2: Manual Deployment via CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy to production
vercel --prod

# Follow the prompts:
# - Link to existing project? Yes
# - Build settings? Use defaults
# - Environment variables? Add as prompted
```

### Method 3: Docker Deployment

If deploying to custom server:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build
RUN npm run build

# Serve with static server
FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=0 /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
docker build -t unity-collection .
docker run -p 3000:3000 unity-collection
```

---

## Post-Deployment Verification

### 1. Verify Deployment

```bash
# Check deployment status
vercel projects --json

# View logs
vercel logs
```

### 2. Test Production URL

1. Visit your production domain
2. Test key features:
   - Homepage loads correctly
   - Shop page displays products
   - Admin login works
   - Cart functionality
   - Checkout flow
   - Order creation

3. Test admin features (if admin):
   - Dashboard loads
   - Can view orders
   - Can manage products
   - Can upload images

### 3. Performance Check

```bash
# Use Lighthouse in Chrome DevTools
# - Performance score
# - Accessibility score
# - Best Practices
# - SEO score

# Check Core Web Vitals via:
# - PageSpeed Insights (web.dev)
# - Vercel Analytics Dashboard
```

### 4. Security Check

```bash
# Use Security Scanner:
# - npm audit
npm audit

# Check HTTPS
# - Visit site and verify SSL certificate
# - Check security headers
```

### 5. Monitoring Setup

1. **Error Tracking**
   - Set up Sentry or similar
   - Monitor application errors
   - Get alerts for critical issues

2. **Analytics**
   - Set up Google Analytics
   - Monitor user behavior
   - Track key metrics

3. **Uptime Monitoring**
   - Use UptimeRobot or similar
   - Monitor 24/7 availability
   - Get alerts if down

---

## Rollback Procedures

### If Deployment Fails or Issues Found

#### Option 1: Vercel Rollback

```bash
# View deployment history
vercel projects --prod

# Rollback to previous deployment
vercel rollback
```

#### Option 2: Git Revert

```bash
# Find problematic commit
git log --oneline

# Revert to previous commit
git revert <commit-hash>

# Push to trigger redeployment
git push origin main
```

#### Option 3: Manual Rollback

1. Go to Vercel Dashboard
2. Select project
3. Go to Deployments
4. Find previous stable deployment
5. Click three dots → "Redeploy"

---

## Monitoring & Support

### Daily Monitoring

- Check error logs daily
- Monitor performance metrics
- Review user feedback
- Check server status

### Weekly Maintenance

- Review analytics
- Check dependency updates
- Test backup/recovery
- Review security logs

### Monthly Review

- Performance analysis
- Database optimization
- Security audit
- Capacity planning

### Alerting

Set up notifications for:
- Deployment failures
- High error rates
- Performance degradation
- SSL certificate expiration
- Disk space issues

### Support Contacts

- Development Team: [Your contact]
- Infrastructure Team: [Your contact]
- Emergency Support: [Emergency number]

---

## Troubleshooting

### Deployment Fails

```bash
# Check build logs
vercel logs --follow

# Verify environment variables
vercel env ls

# Test build locally
npm run build

# Check for errors
npm run lint
```

### Site Shows 404

- Verify build output directory is `dist/`
- Check `package.json` build script
- Verify public files are included

### Database Connection Issues

- Verify SUPABASE_URL is correct
- Check SUPABASE_PUBLISHABLE_KEY
- Confirm database tables exist
- Check RLS policies

### Authentication Not Working

- Verify Supabase URL
- Check admin user exists
- Confirm admin role assigned
- Clear browser cache/cookies

---

## Quick Reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Deploy to Vercel | `vercel --prod` |
| View logs | `vercel logs` |
| Rollback | `vercel rollback` |
| Lint code | `npm run lint` |
| Run tests | `npm run test` |

---

## Checklist Before Deployment

- [ ] All environment variables configured
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors or warnings
- [ ] All features tested locally
- [ ] Security audit passed
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Error tracking configured
- [ ] Monitoring set up
- [ ] Team notified of deployment

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Verified By:** _______________

---

For additional help, check logs or contact the development team.
