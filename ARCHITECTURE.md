# Unity Collection - Project Architecture

## Overview
Unity Collection is a full-stack e-commerce platform built with React + Vite frontend and Supabase backend. The application includes both customer-facing UI and admin dashboard with comprehensive product management.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── cart/            # Shopping cart components
│   ├── home/            # Homepage components
│   ├── layout/          # Layout components (Header, Footer, etc.)
│   ├── product/         # Product detail components
│   ├── shop/            # Shop/listing components
│   ├── skeletons/       # Loading skeleton screens
│   └── ui/              # Shadcn/ui component library
├── pages/               # Page-level components
│   ├── admin/           # Admin dashboard pages
│   ├── Index.tsx        # Homepage
│   ├── Shop.tsx         # Product listing
│   ├── ProductDetail.tsx # Product detail page
│   └── ...
├── contexts/            # React Context for state management
│   └── CartContext.tsx  # Shopping cart state
├── integrations/        # Third-party integrations
│   └── supabase/        # Supabase client and database types
├── lib/                 # Utility functions and helpers
│   ├── supabase.ts      # Supabase client export
│   ├── imageUpload.ts   # Image upload utilities
│   └── utils.ts         # General utilities
├── hooks/               # Custom React hooks
├── test/                # Test configuration and setup
└── main.tsx             # React entry point

supabase/
├── migrations/          # Database schema migrations
└── functions/           # Edge functions (serverless)

```

## Backend Architecture (Supabase)

### Database Schema

The backend uses PostgreSQL through Supabase with Row Level Security (RLS) for authentication and authorization.

#### Core Tables

**1. user_roles** - Admin access control
- `id`: UUID primary key
- `user_id`: References auth.users for admin identification
- `role`: Enum ('admin', 'user')
- `created_at`: Timestamp

**2. categories** - Product categories
- `id`: UUID primary key
- `name`: Category name (TEXT)
- `image_url`: Category image (TEXT)
- `created_at`: Timestamp

**3. products** - Main product inventory
- `id`: UUID primary key
- `name`: Product name (TEXT)
- `description`: Product description (TEXT)
- `price`: Regular price (DECIMAL)
- `discount_price`: Sale price (DECIMAL)
- `category_id`: FK to categories
- `sizes`: Available sizes (TEXT[])
- `image_urls`: Product images (TEXT[])
- `stock_quantity`: Current stock (INTEGER, non-negative)
- `sold_count`: Total units sold (INTEGER)
- `is_featured`: Featured product flag (BOOLEAN)
- `is_active`: Active product flag (BOOLEAN)
- `created_at`, `updated_at`: Timestamps

**4. banners** - Homepage promotional banners
- `id`: UUID primary key
- `image_url`: Banner image (TEXT)
- `title`, `subtitle`: Banner text (TEXT)
- `link`: Banner CTA link (TEXT)
- `overlay_type`: 'green' | 'gold' | 'none'
- `is_active`: Active flag (BOOLEAN)
- `display_order`: Sort order (INTEGER)
- `created_at`: Timestamp

**5. orders** - Customer orders
- `id`: UUID primary key
- `order_id`: Unique order number (TEXT, auto-generated as 'UC-XXXX')
- `customer_name`, `phone`, `address`: Customer details (TEXT)
- `delivery_area`: Delivery region (TEXT)
- `items`: Order items JSON array (JSONB)
- `subtotal`, `total`, `discount_amount`: Amounts (DECIMAL)
- `coupon_code`: Applied coupon (TEXT)
- `referral_code`: Referral code if applicable (TEXT)
- `member_id`: FK to members for loyalty tracking
- `status`: Order status enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')
- `created_at`, `updated_at`: Timestamps

**6. members** - Loyalty program members
- `id`: UUID primary key
- `member_code`: Unique member ID (TEXT, auto-generated as 'UC-MXXXX')
- `name`, `phone`, `email`, `address`: Member details (TEXT)
- `total_purchases`: Cumulative purchase amount (NUMERIC)
- `order_count`: Total orders (INTEGER)
- `discount_value`: Member discount percentage (NUMERIC, default: 5)
- `discount_type`: 'percentage' (TEXT)
- `is_active`: Active member flag (BOOLEAN)
- `created_at`, `updated_at`: Timestamps

**7. coupons** - Discount codes
- `id`: UUID primary key
- `code`: Unique coupon code (TEXT)
- `discount_type`: 'fixed' | 'percentage'
- `discount_value`: Discount amount (DECIMAL)
- `min_purchase`: Minimum purchase requirement (DECIMAL)
- `expiry_date`: Expiration date (TIMESTAMP)
- `is_active`: Active flag (BOOLEAN)
- `usage_count`: Times used (INTEGER)
- `created_at`: Timestamp

**8. referrals** - Referral program configuration
- `id`: UUID primary key
- `referrer_name`: Referrer name (TEXT)
- `code`: Unique referral code (TEXT)
- `commission_type`: 'fixed' | 'percentage'
- `commission_value`: Commission amount (NUMERIC)
- `is_active`: Active flag (BOOLEAN)
- `created_at`, `updated_at`: Timestamps

**9. notice_settings** - Admin notices/alerts
- `id`: UUID primary key
- `text`: Notice text (TEXT)
- `is_active`: Display flag (BOOLEAN)
- `created_at`, `updated_at`: Timestamps

**10. settings** - Application configuration
- `key`: Setting name (TEXT primary key)
- `value`: Setting value (JSONB)
- `updated_at`: Timestamp

### Key Database Functions

**Security Functions**
- `is_admin()`: Check if current user has admin role
- `has_role(user_id, role)`: Check specific user role

**Auto-Generation Functions**
- `generate_order_id()`: Auto-generates order IDs (UC-XXXX format)
- `generate_member_code()`: Auto-generates member codes (UC-MXXXX format)

**Stock Management**
- `decrease_stock_on_order()`: Decreases stock when order is created
- `restore_stock_from_order()`: Restores stock when order is cancelled
- `handle_order_return()`: Restores stock when order is returned

### Row Level Security (RLS) Policies

**Public Read Access**
- Categories, products, banners, notice settings, coupons, referrals: Anyone can read
- Members: Validation access only for discount verification

**Admin-Only Access**
- All CREATE, UPDATE, DELETE operations
- Order viewing and management
- Settings management

**Order Creation**
- Anonymous users can create orders
- Admins can view and modify all orders

### Triggers

Automatic timestamp updates on record modifications:
- `update_products_updated_at`
- `update_orders_updated_at`
- `update_notice_settings_updated_at`
- `update_referrals_updated_at`
- `update_members_updated_at`
- `update_settings_updated_at`

Automatic ID generation:
- `set_order_id`: Generates order IDs
- `generate_member_code_trigger`: Generates member codes

Stock management:
- `decrease_stock_on_order_insert`: Tracks sold items
- `restore_stock_on_order_delete`: Handles cancellations
- `handle_order_return_trigger`: Processes returns

## Frontend Architecture

### State Management

**React Context**
- `CartContext`: Manages shopping cart state and operations
- Theme management via `next-themes`

**Data Fetching**
- React Query (`@tanstack/react-query`) for server state management
- Supabase real-time subscriptions for live updates

### Component Architecture

**Page Components**
- Each page is a route handler with full page logic
- Nested components for modular UI

**Layout Components**
- `Header`: Navigation and cart access
- `Footer`: Footer information
- `Layout`: Main page wrapper

**Feature Components**
- Cart: Add/remove items, quantity management
- Shop: Product listing with filters
- Product Detail: Individual product view
- Admin Dashboard: Management interfaces

### Routing

Routes configured in `App.tsx`:

**Customer Routes**
- `/` - Homepage
- `/shop` - Product listing
- `/product/:id` - Product detail
- `/categories` - Category listing
- `/cart` - Shopping cart
- `/contact` - Contact form
- `/about` - About page

**Admin Routes**
- `/admin/login` - Admin authentication
- `/admin` - Admin dashboard
- `/admin/products` - Product management
- `/admin/categories` - Category management
- `/admin/banners` - Banner management
- `/admin/coupons` - Coupon management
- `/admin/orders` - Order management
- `/admin/members` - Member management
- `/admin/referrals` - Referral management
- `/admin/notice` - Notice settings

## Data Flow

### Order Creation Flow
1. Customer adds items to cart
2. Navigates to checkout
3. Fills order form (name, phone, address, etc.)
4. Submits order to `/api/orders` or Supabase insert
5. Trigger automatically:
   - Generates unique order ID
   - Decreases product stock
   - Updates sold_count
6. Member discount applied if applicable
7. Coupon discount applied if valid

### Product Management Flow
1. Admin logs in via `/admin/login`
2. Admin navigates to product management
3. Can create, read, update, delete products
4. Images uploaded to Supabase storage
5. Product data stored with references
6. Stock automatically tracked

### Member Management Flow
1. Customer reaches loyalty threshold ($5000 purchase)
2. Member record created automatically
3. Member code generated (UC-MXXXX)
4. Subsequent orders apply member discount
5. Admins can view member details and purchase history

## Environment Variables

Required for deployment:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Build & Deployment

**Build Process**
```bash
npm install       # Install dependencies
npm run build    # Production build → dist/
```

**Deployment**
- Output directory: `dist/`
- Build command: `npm run build`
- Deploy to Vercel, Netlify, or any static host

**Development**
```bash
npm run dev       # Start dev server on :8080
```

## Technology Stack

**Frontend**
- React 18.3
- React Router 6.30
- Vite 5.4
- TypeScript 5.8
- Tailwind CSS 3.4
- Shadcn/ui components
- Recharts for data visualization

**Backend**
- Supabase (PostgreSQL)
- Row Level Security
- PostgreSQL functions and triggers
- Edge Functions (serverless)

**State & Data**
- React Context API
- React Query 5.83
- React Hook Form

**UI/UX**
- Framer Motion (animations)
- Sonner (toast notifications)
- Lucide React (icons)
- Next-themes (dark mode)

## Security Features

- **Row Level Security**: Database-level access control
- **Admin Role System**: Prevents unauthorized access
- **Environment Variables**: Secrets not exposed in code
- **Type Safety**: TypeScript for compile-time type checking
- **CORS**: Configured for Supabase
- **Input Validation**: Form validation with Zod and React Hook Form

## Monitoring & Logging

- Browser console for client-side debugging
- Supabase dashboard for database monitoring
- Error boundaries for graceful error handling
- Component logging for development

## Future Enhancements

- Payment gateway integration (Stripe, PayPal)
- Email notifications for orders
- SMS notifications for delivery
- Advanced analytics and reporting
- Inventory forecasting
- Automated reorder system
- Customer review system
- Wishlist feature
