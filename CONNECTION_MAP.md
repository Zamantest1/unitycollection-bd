# Frontend-Backend Connection Map

## Visual Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  CUSTOMER PAGES          │    ADMIN PAGES               │
│  ──────────────           │    ──────────                │
│  • Shop                   │    • AdminDashboard          │
│  • ProductDetail          │    • AdminProducts           │
│  • Cart                   │    • AdminOrders             │
│  • OrderForm              │    • AdminMembers            │
│                           │    • AdminCoupons            │
│                           │    • AdminReferrals          │
│                           │    • AdminCategories         │
│                           │    • AdminBanners            │
│                           │    • AdminNotice             │
│                           │    • AdminLogin              │
│                                                           │
└─────────────────────────────────────────────────────────┘
                            ↓
                    React Query (Hooks)
                            ↓
┌─────────────────────────────────────────────────────────┐
│               SUPABASE CLIENT                           │
│  (src/integrations/supabase/client.ts)                 │
├─────────────────────────────────────────────────────────┤
│  • useQuery() - Data fetching                          │
│  • useMutation() - Create/Update/Delete                │
│  • Automatic error handling                            │
│  • Token management & auth                             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│          SUPABASE BACKEND (PostgreSQL)                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  DATA TABLES:                                           │
│  ├── products (customer & admin use)                   │
│  ├── categories (product organization)                 │
│  ├── orders (checkout & admin mgmt)                    │
│  ├── members (loyalty program)                         │
│  ├── coupons (discount codes)                          │
│  ├── referrals (referral programs)                     │
│  ├── banners (homepage promotions)                     │
│  ├── notice_settings (announcements)                   │
│  └── user_roles (admin authorization)                 │
│                                                           │
│  SECURITY:                                              │
│  ├── Row Level Security (RLS) policies                 │
│  ├── Admin role checks                                 │
│  └── Automatic triggers (stock management)             │
│                                                           │
│  STORAGE:                                               │
│  └── product-images bucket (file uploads)              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Page-to-Table Connections

### Customer Pages

| Page | Database Tables | Operations | Auth Required |
|------|-----------------|-----------|---------------|
| Shop | products, categories | SELECT | ✗ No |
| ProductDetail | products, categories | SELECT | ✗ No |
| Cart | (localStorage only) | Client-side | ✗ No |
| OrderForm | orders, coupons, referrals, members, products | INSERT, SELECT | ✗ No |

### Admin Pages

| Page | Database Tables | Operations | Auth Required |
|------|-----------------|-----------|---------------|
| AdminLogin | auth.users, user_roles | SELECT | ✗ No (login only) |
| AdminDashboard | orders, products, members | SELECT | ✓ Admin |
| AdminProducts | products, categories, storage | SELECT, INSERT, UPDATE, DELETE | ✓ Admin |
| AdminOrders | orders, products, members | SELECT, UPDATE | ✓ Admin |
| AdminMembers | members, orders | SELECT, INSERT, UPDATE, DELETE | ✓ Admin |
| AdminCoupons | coupons | SELECT, INSERT, UPDATE, DELETE | ✓ Admin |
| AdminReferrals | referrals | SELECT, INSERT, UPDATE, DELETE | ✓ Admin |
| AdminCategories | categories | SELECT, INSERT, UPDATE, DELETE | ✓ Admin |
| AdminBanners | banners | SELECT, INSERT, UPDATE, DELETE | ✓ Admin |
| AdminNotice | notice_settings | SELECT, UPDATE | ✓ Admin |

## Data Query Examples

### Example 1: Shop Page → Products

```
Shop.tsx
  ↓
useQuery("products")
  ↓
supabase.from("products").select("*, categories(name)").eq("is_active", true)
  ↓
ProductCard Component (displays each product)
  ↓
AddToCartButton or Direct Order
```

### Example 2: OrderForm → Multiple Tables

```
OrderForm.tsx
  ↓
useQuery("coupons") + useQuery("referrals") + useQuery("members")
  ↓
Validate coupon code
  ↓
Calculate discount
  ↓
useMutation - Create order
  ↓
supabase.from("orders").insert({ customer data, items, total })
  ↓
TRIGGER: Auto-decrease product stock
  ↓
Order confirmation
```

### Example 3: Admin Product Management

```
AdminProducts.tsx
  ↓
useQuery("products") - List all products
  ↓
Add Product Button → useMutation
  ↓
MultiImageUpload → Supabase Storage
  ↓
supabase.from("products").insert(product_data)
  ↓
Product list refetches automatically
```

## Real-Time Operations

### Stock Management
```
Order Created
  ↓
DATABASE TRIGGER: decrease_stock_on_order_insert
  ↓
Product.stock_quantity -= order_quantity
Product.sold_count += order_quantity
  ↓
Admin sees updated stock immediately
```

### Order Status Flow
```
Customer creates order → status = "pending"
  ↓
Admin confirms → status = "confirmed"
  ↓
Admin ships → status = "shipped"
  ↓
Admin delivers → status = "delivered"
(or back to "returned")
```

## Request-Response Cycle

### 1. Fetch Products (Read)
```
REQUEST:
supabase
  .from("products")
  .select("*, categories(name)")
  .eq("is_active", true)

RESPONSE:
[
  { id: "uuid", name: "...", price: 500, category_id: "uuid", ... },
  { id: "uuid", name: "...", price: 1200, category_id: "uuid", ... },
  ...
]
```

### 2. Create Order (Write)
```
REQUEST:
supabase
  .from("orders")
  .insert({
    customer_name: "John",
    phone: "01234567890",
    items: [{ product_id, quantity, ... }],
    total: 5000,
    coupon_code: "SAVE10",
    ...
  })

RESPONSE:
{ 
  id: "uuid",
  order_id: "UC-1234",
  status: "pending",
  created_at: "2024-02-14T...",
  ...
}

TRIGGERS:
✓ Stock decreased
✓ Order ID generated
```

### 3. Update Product (Admin)
```
REQUEST:
supabase
  .from("products")
  .update({ name, price, description, ... })
  .eq("id", product_id)

RESPONSE:
{ id: "uuid", updated_at: "2024-02-14T...", ... }

SIDE EFFECTS:
✓ Cache invalidated
✓ List view refetches
✓ Admin sees update immediately
```

## Error Handling Flow

```
Request to Supabase
  ↓
If error exists:
  ├─ Network error → Show "Connection failed"
  ├─ RLS violation → Show "Unauthorized"
  ├─ Validation error → Show specific message
  └─ Database error → Show error message
  ↓
Toast notification displays
  ↓
User can retry
```

## Cache Management (React Query)

```
Page loads
  ↓
Query executes, data cached
  ↓
Page navigates away
  ↓
Data remains in cache (stale)
  ↓
User comes back
  ↓
If data is stale (>5min), auto-refetch
  ↓
User manually refreshes (pull-to-refresh)
  ↓
Invalidate cache → Force refetch
```

## Authentication & Authorization Flow

### Customer (No Auth)
```
Visit Shop → View products (no login required)
Add to cart → Order form (no login required)
Place order → Create order (no login required)
```

### Admin (With Auth)
```
Visit /admin → Redirect to login page
Login (email/password) → Supabase Auth
  ↓
Check user_roles table
  ├─ Has 'admin' role → Grant access
  └─ No 'admin' role → Show "Unauthorized"
Access admin pages → RLS policies enforce access
Admin operations → Only admin can modify
Logout → Clear session
```

## Performance Optimizations

1. **React Query Caching**: Data cached, prevents unnecessary requests
2. **Pull-to-Refresh**: Manual refresh when needed
3. **Pagination** (if implemented): Load products in batches
4. **Image Optimization**: Supabase CDN serves images
5. **Lazy Loading**: Components load data as needed

## Testing Connection

```bash
# 1. Check env variables
cat .env | grep SUPABASE

# 2. Visit Shop page - should see products
http://localhost:5173/shop

# 3. Try adding to cart - should persist
# 4. Try placing order - should create in database
# 5. Login to admin - should show dashboard
# 6. Create product - should appear in shop
```

## Troubleshooting Connection Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Products don't load | Missing env vars | Check .env file |
| "Unauthorized" error | RLS policy blocking | Check RLS policies |
| Images not uploading | Storage permission | Check storage policies |
| Orders not creating | Stock check failed | Check product stock > order qty |
| Admin pages blank | Not authenticated | Login with admin account |
| Slow data loading | Stale cache | Pull-to-refresh or force refetch |

