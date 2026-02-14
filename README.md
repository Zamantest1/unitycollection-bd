# Unity Collection - E-Commerce Platform

A modern, full-stack e-commerce platform with customer storefront, shopping cart, loyalty program, and admin dashboard.

## Quick Start

```bash
# Install dependencies (npm only)
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_key

# Start development server
npm run dev
```

## Build & Deployment

```bash
# Production build
npm run build
# Output: dist/

# Deploy to Vercel
# 1. Push to GitHub
# 2. Connect on Vercel dashboard
# 3. Add environment variables
# 4. Deploy
```

## Documentation

- **[BACKEND_CONNECTION_SUMMARY.md](./BACKEND_CONNECTION_SUMMARY.md)** - Quick overview of how all pages connect to backend
- **[CONNECTION_MAP.md](./CONNECTION_MAP.md)** - Visual data flow and page-to-table connections
- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - Detailed integration patterns and data fetching
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete backend logic, database schema, and system design

## Technologies

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL), Row Level Security
- **State Management**: React Context, React Query
- **UI Components**: Shadcn/ui, Radix UI, Framer Motion
