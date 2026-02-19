

## Bulk Download Customer Details for SMS

Add a "Download Customer Details" button to the Admin Orders page that exports a CSV file containing customer information from filtered orders. This will help you collect customer phone numbers and details for SMS campaigns.

### What You'll Get

- A new "Download Customers" button in the orders page toolbar (next to the search/filter bar)
- Exports a CSV file with columns: Customer Name, Phone, Address, Delivery Area, Order Count, Total Spent, Last Order Date
- The export respects your current filters (status, search, referral) so you can download specific segments (e.g., only "delivered" customers)
- Automatically de-duplicates customers by phone number so each customer appears only once, even if they have multiple orders
- Aggregates order count and total spent per customer for better insights

### How It Works

1. You apply any filters you want (e.g., filter by "delivered" status to get confirmed buyers)
2. Click the "Download Customers" button
3. A CSV file downloads with all unique customers from the filtered orders
4. Open the CSV in Excel or Google Sheets and use the phone numbers for SMS

### Technical Details

| File | Change |
|------|--------|
| `src/pages/admin/AdminOrders.tsx` | Add a `downloadCustomerCSV()` function that processes `filteredOrders`, de-duplicates by phone number, aggregates stats, and triggers a CSV file download. Add a "Download Customers" button to the toolbar area. |

No database changes needed -- all data already exists in the orders table.

