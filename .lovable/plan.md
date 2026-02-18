

## Add Product Code System

Add an auto-generated product code (e.g., `UC-P0001`) to every product for easy identification by both admin and customers.

### What You'll Get

- Every product gets a unique code like `UC-P0001`, `UC-P0002`, etc.
- Codes are auto-generated when a product is created (no manual input needed)
- Existing products will get codes assigned based on creation order
- Customers can see the code on the product detail page (below the product name)
- Product cards in the shop also show the code subtly
- Admin can search products by code
- Admin product cards display the code prominently
- Order details in admin show product codes next to item names

### Where the Code Appears

**Customer Side:**
- Product detail page: shown as a small muted label like "Product Code: UC-P0001" under the product name
- Product cards (shop grid): shown as a tiny label under the category name

**Admin Side:**
- Product cards: shown next to the product name
- Search bar: filters by both name and product code
- Product edit form: read-only display of the auto-generated code
- Order detail modal: product code shown next to each item name

### Technical Details

| Change | Details |
|--------|---------|
| Database migration | Add `product_code` column (unique, not null with default), create `generate_product_code()` trigger function, backfill existing products sequentially by creation date |
| `src/pages/admin/AdminProducts.tsx` | Show product code on cards (line 423 area), include `product_code` in search filter (line 199-201), show read-only code in edit form |
| `src/pages/ProductDetail.tsx` | Display product code below product name (after line 177) |
| `src/components/shop/ProductCard.tsx` | Show product code as small text under category name |
| `src/pages/admin/AdminOrders.tsx` | Show product code next to item names in order detail modal |

**Database trigger logic:**
- On INSERT into products, auto-generate `UC-P` + zero-padded sequential number
- Find the current max number from existing codes and increment by 1
- Backfill migration assigns codes to all existing products ordered by `created_at`

