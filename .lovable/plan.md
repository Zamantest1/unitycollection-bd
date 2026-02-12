

## Stock Display Changes

### What will change

**1. Product Cards (Shop page)** - `src/components/shop/ProductCard.tsx`
- Remove the "Only X left" badge entirely from product cards (visitors should not see stock counts on the listing page)

**2. Product Detail Page** - `src/pages/ProductDetail.tsx`
- When stock is above 5: Show "In Stock" (no quantity number)
- When stock is 2-5: Hide low stock warning (show just "In Stock")
- When stock is exactly 1: Show a warning like "Hurry! Only 1 left in stock"
- When stock is 0: Show "Out of Stock" (unchanged)

### Technical Details

**`src/components/shop/ProductCard.tsx`:**
- Remove the `isLowStock` variable and the badge that shows "Only {stockQuantity} left"

**`src/pages/ProductDetail.tsx`:**
- Change `isLowStock` threshold from `<= 5` to `=== 1`
- When stock > 5: Show simple "In Stock" without showing the count
- When stock is 2-5: Show "In Stock" without count
- When stock is 1: Show warning "Hurry! Only 1 left in stock" with a more urgent style
- Remove the exact stock count display from the "In Stock" state (currently shows "In Stock (X available)")

