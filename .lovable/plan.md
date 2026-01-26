
# Implementation Plan: Inventory, Stock Management, Referral System, and Image Handling

## Overview
This plan covers a comprehensive upgrade to Unity Collection with:
1. Replace Cloudinary with Supabase Storage for reliable image uploads
2. Add sample products with real images
3. Complete inventory and stock management system
4. Order delete and return handling with automatic stock restoration
5. Referral system (extension of coupon system)
6. Category and inventory insights

---

## Part 1: Replace Cloudinary with Supabase Storage

Since Cloudinary is not working reliably, we'll switch to Supabase Storage which is already integrated.

### Database Changes
Create a storage bucket for product images:
- Bucket name: `product-images`
- Public access: Yes (for image URLs)
- Automatic compression via URL transformations

### Files to Create/Modify

**1. Create new image upload utilities**
- `src/lib/imageUpload.ts` - New utility for Supabase Storage uploads with compression
  - Compress images on client-side before upload (using canvas API)
  - Maximum dimension: 1200px
  - Quality: 80%
  - Output format: WebP for better compression

**2. Update upload components**
- `src/components/admin/ImageUpload.tsx` - Use Supabase Storage instead of Cloudinary
- `src/components/admin/MultiImageUpload.tsx` - Use Supabase Storage

**3. Delete Cloudinary edge function** (no longer needed)
- Remove `supabase/functions/cloudinary-upload/`

---

## Part 2: Add Sample Products

Insert 8 sample products with placeholder images from Unsplash/Pexels (royalty-free):

| Product Name | Category | Price | Stock |
|-------------|----------|-------|-------|
| Royal Blue Punjabi | Casual Punjabi | 1,200 | 25 |
| Elegant Cream Punjabi | Premium Collection | 2,500 | 15 |
| Festive Red Punjabi | Festive Wear | 1,800 | 20 |
| Classic White Punjabi | Eid Collection | 1,500 | 30 |
| Navy Traditional Punjabi | Casual Punjabi | 1,100 | 35 |
| Golden Embroidered Punjabi | Premium Collection | 3,200 | 10 |
| Maroon Wedding Punjabi | Festive Wear | 2,800 | 12 |
| Sky Blue Cotton Punjabi | Casual Punjabi | 950 | 40 |

---

## Part 3: Inventory & Stock Management

### Database Schema Changes

**Add columns to `products` table:**
```text
+------------------+
|     products     |
+------------------+
| (existing cols)  |
| + stock_quantity |  <- integer, default 0
| + sold_count     |  <- integer, default 0
+------------------+
```

**Add columns to `orders` table:**
```text
+------------------+
|     orders       |
+------------------+
| (existing cols)  |
| + referral_code  |  <- text, nullable
+------------------+
```

### Frontend Changes

**1. Admin Products Page (`AdminProducts.tsx`)**
- Add stock quantity input field
- Display current stock, sold count, and available quantity
- Add "Restock" quick action button
- Show "Out of Stock" badge for 0 stock items

**2. Product Detail Page (`ProductDetail.tsx`)**
- Show available stock count (e.g., "Only 3 left in stock")
- Display "Out of Stock" or "Sold Out" badge when stock = 0
- Disable Buy/Order button when out of stock
- Grey out unavailable products

**3. Order Form (`OrderForm.tsx`)**
- Validate stock availability before order submission
- Show error if product is out of stock
- Block order if stock = 0

**4. Stock Update Logic**
- Create database trigger to:
  - Decrease stock on order creation
  - Increase stock on order deletion
  - Increase stock on order return

---

## Part 4: Order Delete & Return Handling

### Database Changes

**Update `orders` table status options:**
- Add "returned" status option

**Create database function for stock restoration:**
```text
restore_stock_from_order(order_id)
- Parses order items JSON
- Restores stock_quantity for each product
- Increments sold_count (negative for returns)
```

### Admin Orders Page Updates

**1. Add action buttons:**
- Delete Order button (with confirmation)
- Mark as Returned button

**2. Delete Order Logic:**
- Confirm deletion with user
- Call stock restoration function
- Remove order from database

**3. Return Order Logic:**
- Update status to "returned"
- Call stock restoration function
- Keep order in database for records

---

## Part 5: Referral System

### Database Schema

**Create new `referrals` table:**
```text
+------------------------+
|       referrals        |
+------------------------+
| id (uuid, PK)          |
| referrer_name (text)   |
| code (text, unique)    |
| commission_type (text) |  <- 'fixed' or 'percentage'
| commission_value (num) |
| is_active (boolean)    |
| created_at (timestamp) |
+------------------------+
```

### Admin Panel

**Create new `AdminReferrals.tsx` page:**
- Add/Edit/Delete referral codes
- Set referrer name, code, commission type/value
- Toggle active/inactive status
- Dashboard showing:
  - Total orders per referral
  - Total sales per referral
  - Total commission earned

### Order Form Updates

**Add referral code input:**
- Optional field
- Validate code exists in database
- Save referral_code with order (no discount applied)

### Admin Orders Updates

- Show referral code used (if any)
- Filter orders by referral code

---

## Part 6: Category & Inventory Insights

### Admin Categories Page

**Add statistics per category:**
- Total products count
- Total available stock
- Total sold count

### Admin Dashboard

**Enhanced statistics:**
- Total stock value (sum of price * stock)
- Low stock alerts (items with stock less than 5)
- Top selling products
- Referral performance summary

### Frontend Category View (Optional)

- Show product count per category on category cards

---

## Technical Implementation Summary

### Database Migrations Required

1. Create `product-images` storage bucket
2. Add `stock_quantity` and `sold_count` to products
3. Add `referral_code` to orders
4. Create `referrals` table with RLS policies
5. Create stock management database functions

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/imageUpload.ts` | Supabase Storage upload with compression |
| `src/pages/admin/AdminReferrals.tsx` | Referral management page |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/ImageUpload.tsx` | Switch to Supabase Storage |
| `src/components/admin/MultiImageUpload.tsx` | Switch to Supabase Storage |
| `src/pages/admin/AdminProducts.tsx` | Add stock management UI |
| `src/pages/admin/AdminOrders.tsx` | Add delete/return actions |
| `src/pages/admin/AdminCategories.tsx` | Add inventory insights |
| `src/pages/admin/AdminDashboard.tsx` | Enhanced statistics |
| `src/pages/ProductDetail.tsx` | Stock availability display |
| `src/components/product/OrderForm.tsx` | Stock validation + referral input |
| `src/components/shop/ProductCard.tsx` | Out of stock badge |
| `src/App.tsx` | Add referrals route |
| `src/components/admin/AdminLayout.tsx` | Add referrals nav link |

### Files to Delete

| File | Reason |
|------|--------|
| `supabase/functions/cloudinary-upload/index.ts` | Replaced by Supabase Storage |
| `src/lib/cloudinaryUpload.ts` | No longer needed |

---

## Implementation Order

1. **Phase 1**: Database migrations (storage bucket, table changes)
2. **Phase 2**: Image upload system replacement
3. **Phase 3**: Add sample products
4. **Phase 4**: Stock management UI and logic
5. **Phase 5**: Order delete/return functionality
6. **Phase 6**: Referral system
7. **Phase 7**: Category insights and dashboard updates
