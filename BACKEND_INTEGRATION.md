# Backend Integration Guide

## Overview

The Unity Collection e-commerce platform is fully integrated with Supabase backend using React Query for efficient data fetching and state management. All frontend pages are connected to their corresponding database operations.

## Architecture Overview

```
Frontend (React) ↔ React Query ↔ Supabase Client ↔ PostgreSQL Database
```

## How the Integration Works

### 1. Supabase Client Setup

**File**: `src/integrations/supabase/client.ts`

The Supabase client is initialized with environment variables:
```typescript
VITE_SUPABASE_URL - Your Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY - Your anon key for client-side operations
```

**Features**:
- Automatic session persistence via localStorage
- Auto token refresh
- Type-safe operations via TypeScript types

### 2. Data Fetching Pattern

All pages use React Query for data fetching with Supabase. Example pattern:

```typescript
const { data: products, isLoading } = useQuery({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("is_active", true);
    if (error) throw error;
    return data;
  },
});
```

## Frontend-Backend Connections

### Customer-Facing Pages

#### 1. Shop Page (`src/pages/Shop.tsx`)
- **Query**: Fetches all active products with category info
- **Operations**: 
  - List products
  - Filter by category
  - Search products
  - Pull-to-refresh to refetch data

**Database Tables Used**: `products`, `categories`

#### 2. Product Detail Page (`src/pages/ProductDetail.tsx`)
- **Query**: Fetches single product by ID
- **Operations**:
  - Display product images
  - Show product sizes
  - Display pricing and discount info
  - Add to cart or place order

**Database Tables Used**: `products`, `categories`

#### 3. Cart Page (`src/pages/Cart.tsx`)
- **Storage**: LocalStorage for cart items (persists on browser)
- **Operations**:
  - Add items to cart
  - Update quantities
  - Remove items
  - Calculate totals
  - Apply coupons

**Database Tables Used**: None (client-side only), but validates against `products`, `coupons`

#### 4. Order Form (`src/components/product/OrderForm.tsx`)
- **Mutations**: Creates orders in database
- **Operations**:
  - Validate customer info
  - Apply coupon codes (queries `coupons` table)
  - Validate referral codes (queries `referrals` table)
  - Validate member codes (queries `members` table)
  - Calculate discounts
  - Create order in `orders` table
  - Automatically decreases product stock

**Database Tables Used**: `orders`, `coupons`, `referrals`, `members`, `products` (stock update)

### Admin Dashboard Pages

All admin pages follow the same pattern: fetch, create, update, delete operations using React Query mutations.

#### 1. Admin Dashboard (`src/pages/admin/AdminDashboard.tsx`)
- **Queries**: Fetches summary statistics
- **Operations**: Display order count, total revenue, etc.

**Database Tables Used**: `orders`, `products`, `members`

#### 2. Admin Products (`src/pages/admin/AdminProducts.tsx`)
- **Queries**: List all products
- **Mutations**:
  - Create product
  - Update product
  - Delete product
  - Restock product (increase stock_quantity)
- **Features**:
  - Multi-image upload to Supabase Storage
  - Batch operations
  - Search and filter

**Database Tables Used**: `products`, `categories`

**Storage**: `product-images` bucket in Supabase

#### 3. Admin Orders (`src/pages/admin/AdminOrders.tsx`)
- **Queries**: List all orders with filters
- **Mutations**: Update order status (pending → confirmed → shipped → delivered)
- **Features**: View order details, track fulfillment

**Database Tables Used**: `orders`, `products`, `members`

#### 4. Admin Members (`src/pages/admin/AdminMembers.tsx`)
- **Queries**: List all members
- **Mutations**:
  - Create member
  - Update member discount
  - Deactivate member
- **Features**: Manage loyalty program members

**Database Tables Used**: `members`, `orders`

#### 5. Admin Coupons (`src/pages/admin/AdminCoupons.tsx`)
- **Queries**: List all coupons
- **Mutations**:
  - Create coupon
  - Update coupon
  - Delete coupon
- **Features**: Set discount type, amount, expiry date

**Database Tables Used**: `coupons`

#### 6. Admin Referrals (`src/pages/admin/AdminReferrals.tsx`)
- **Queries**: List all referral programs
- **Mutations**:
  - Create referral program
  - Update program details
- **Features**: Set commission type and value

**Database Tables Used**: `referrals`

#### 7. Admin Categories (`src/pages/admin/AdminCategories.tsx`)
- **Queries**: List all categories
- **Mutations**:
  - Create category
  - Update category
  - Delete category

**Database Tables Used**: `categories`

#### 8. Admin Banners (`src/pages/admin/AdminBanners.tsx`)
- **Queries**: List all banners
- **Mutations**:
  - Create banner
  - Update banner
  - Delete banner
- **Features**: Set overlay type, display order

**Database Tables Used**: `banners`

#### 9. Admin Notice (`src/pages/admin/AdminNotice.tsx`)
- **Queries**: List notice settings
- **Mutations**: Update notice text and active status

**Database Tables Used**: `notice_settings`

### Admin Login (`src/pages/admin/AdminLogin.tsx`)
- **Authentication**: Supabase Auth (email/password)
- **Authorization**: Checks `user_roles` table for 'admin' role
- **Features**: Login form, password management

**Database Tables Used**: `auth.users` (Supabase built-in), `user_roles`

## Database Tables & Their Connections

### 1. Products Table
- **Used By**: Shop, ProductDetail, AdminProducts, Cart
- **Operations**: SELECT (read), INSERT (admin), UPDATE (admin), DELETE (admin)
- **Triggers**: Stock auto-decreases on order creation via trigger

### 2. Orders Table
- **Used By**: OrderForm, AdminOrders, AdminDashboard
- **Operations**: INSERT (order creation), SELECT (view), UPDATE (status changes)
- **Triggers**: Auto-generates order ID, decreases stock, restores stock on return

### 3. Members Table
- **Used By**: OrderForm, AdminMembers, AdminDashboard
- **Operations**: SELECT (validate member), INSERT (create), UPDATE (update discount)

### 4. Coupons Table
- **Used By**: OrderForm, AdminCoupons, Cart
- **Operations**: SELECT (validate coupon), INSERT (create), UPDATE (update), DELETE (admin)

### 5. Referrals Table
- **Used By**: OrderForm, AdminReferrals
- **Operations**: SELECT (validate referral), INSERT (create), UPDATE (update), DELETE (admin)

### 6. Categories Table
- **Used By**: Shop, ProductDetail, AdminCategories, AdminProducts
- **Operations**: SELECT (display), INSERT (admin), UPDATE (admin), DELETE (admin)

### 7. Banners Table
- **Used By**: Home/Hero section, AdminBanners
- **Operations**: SELECT (display), INSERT (admin), UPDATE (admin), DELETE (admin)

### 8. Notice Settings Table
- **Used By**: Layout/Header, AdminNotice
- **Operations**: SELECT (display), UPDATE (admin)

### 9. User Roles Table
- **Used By**: AdminLogin authorization check
- **Operations**: SELECT (check if user is admin)

## API Query Pattern

All queries follow this consistent pattern:

```typescript
// Fetch pattern
const { data, isLoading, error } = useQuery({
  queryKey: ["resources", filter],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("table_name")
      .select("columns")
      .filter();
    if (error) throw error;
    return data;
  },
});

// Mutation pattern
const mutation = useMutation({
  mutationFn: async (newData) => {
    const { data, error } = await supabase
      .from("table_name")
      .insert(newData);
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["resources"] });
    toast({ title: "Success!" });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

## Real-Time Features

- **Pull-to-Refresh**: Manually refresh product list
- **Auto-Refetch**: React Query automatically refetches stale data
- **Optimistic Updates**: UI updates before server confirmation

## File Structure for Integration

```
src/
├── integrations/supabase/
│   ├── client.ts              # Main Supabase client
│   ├── types.ts               # Auto-generated TypeScript types
│   └── functions/             # Edge functions
├── lib/
│   ├── supabase.ts            # Wrapper exports
│   └── imageUpload.ts         # Image upload helper
├── contexts/
│   └── CartContext.tsx        # Client-side cart state
├── hooks/
│   └── use-toast.ts           # Toast notifications
├── pages/
│   ├── Shop.tsx               # Product listing
│   ├── ProductDetail.tsx      # Single product
│   ├── Cart.tsx               # Shopping cart
│   └── admin/                 # Admin pages
└── components/
    ├── product/
    │   └── OrderForm.tsx      # Order creation
    └── admin/
        ├── ImageUpload.tsx    # Single image upload
        └── MultiImageUpload.tsx  # Multiple image upload
```

## Error Handling

All requests include error handling:
- Supabase errors are caught and displayed via toast notifications
- Network errors are handled gracefully
- Loading states prevent UI issues

## Authentication & Authorization

### Customer-Side
- No authentication required for shopping
- Orders created anonymously

### Admin-Side
- Must be logged in via AdminLogin page
- User role checked in `user_roles` table
- Only admin users can access admin pages
- All mutations blocked for non-admin users

## Environment Variables

Required for production:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Deployment Checklist

- ✅ Supabase project created
- ✅ All migrations applied (tables, functions, triggers, RLS policies)
- ✅ Environment variables set in Vercel
- ✅ Storage bucket configured for images
- ✅ Admin user created with 'admin' role
- ✅ Row Level Security (RLS) policies active
- ✅ Build succeeds: `npm run build`
- ✅ Deploy to Vercel

## Testing the Integration

1. **Frontend Data Display**: Visit Shop page, verify products load
2. **Admin Operations**: Login to admin, create/edit/delete items
3. **Orders**: Place an order, verify it appears in admin
4. **Coupons**: Apply coupon code, verify discount calculated
5. **Members**: Create member, verify discount applied
6. **Stock**: Place order, verify stock decreases in admin

## Troubleshooting

**Products not loading?**
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
- Verify RLS policies allow SELECT on products table
- Check browser console for errors

**Admin pages unauthorized?**
- Ensure user has 'admin' role in `user_roles` table
- Check RLS policies on admin-specific tables

**Images not uploading?**
- Verify storage bucket `product-images` exists
- Check RLS policies on storage objects
- Ensure image size < 5MB

**Orders not creating?**
- Verify `orders` table RLS allows INSERT from anon
- Check product stock > quantity ordered
- Verify coupon code exists if provided
