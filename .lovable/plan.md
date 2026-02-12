

## Admin Low Stock Warning for Last Item

### What will change

In the admin Products page (`src/pages/admin/AdminProducts.tsx`), update the warning system to specifically highlight products with exactly 1 unit left:

**1. Top Alert Banner (line 203-215)**
- Change the count from "stock < 5" to "stock === 1"
- Update message to something like: "X product(s) have only 1 item left in stock - restock soon!"
- Use a more urgent pulsing style to grab attention

**2. Product Card Badges (lines 403, 407, 436-440)**
- Keep "Out of Stock" badge (stock = 0) as-is
- Change "Low Stock" badge (was < 5) to only show when stock === 1
- Update badge text from "Low Stock" to "Last One!" with a more urgent red/orange style
- Update card border highlight to only apply when stock === 1

**3. Stock Number Color (line 449)**
- Update the yellow color threshold from < 5 to === 1 so the stock count shows in warning color only for the last item

### Technical Details

All changes are in `src/pages/admin/AdminProducts.tsx`:
- `lowStockCount` filter: change `p.stock_quantity < 5` to `p.stock_quantity === 1`
- `isLowStock` variable: change `product.stock_quantity < 5` to `product.stock_quantity === 1`
- Badge text: "Low Stock" becomes "Last One!" or "Only 1 Left"
- Alert text updated to reflect the single-item urgency

