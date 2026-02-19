

## 1. Order Editing + 2. New Dashboard Business Stats

Two features: edit any order's details, and add 4 new business insight cards to the dashboard.

---

### Feature 1: Edit Orders

An "Edit" button (pencil icon) on each order card opens an edit modal where you can change:

- Customer Name, Phone, Address, Delivery Area
- Coupon Code (recalculates discount and total automatically)
- Item quantities (adjust or remove items, recalculates totals)

When you change the coupon, the system checks the coupons table, validates it, and recalculates the discount and total. When you change item quantities, the subtotal and total update accordingly.

---

### Feature 2: 4 New Dashboard Stats Cards

A second row of cards below the existing ones showing:

| Card | What it shows |
|------|--------------|
| Total Revenue | Sum of order totals where status is "delivered" |
| Items Sold | Sum of `sold_count` from all products |
| Total Stock | Sum of `stock_quantity` from all products |
| Discounts Given | Sum of `discount_amount` from all orders |

These appear as a second row of 4 cards with different icons, giving you a quick business overview.

---

### Technical Details

| File | Changes |
|------|---------|
| `src/pages/admin/AdminOrders.tsx` | Add edit state and edit modal with form fields (customer name, phone, address, delivery area, coupon code, item quantities). Add edit mutation that updates the order in the database. Add Edit (pencil) button next to the Eye button on each order card. Coupon validation fetches from the coupons table and recalculates discount/total. |
| `src/pages/admin/AdminDashboard.tsx` | Add a second query that fetches all products (`stock_quantity`, `sold_count`) and all orders (`total`, `discount_amount`, `status`). Calculate the 4 business metrics. Render a second row of 4 stat cards below the existing ones with icons: DollarSign (revenue), TrendingUp (items sold), Warehouse (stock), Percent (discounts). |

No database changes needed -- all data already exists.

