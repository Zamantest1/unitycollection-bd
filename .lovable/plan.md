
# Fix Plan: Replace Bengali Taka Symbol in WhatsApp Messages

## Problem Identified

When an order is confirmed and sent to WhatsApp, the message displays a `�` (replacement character) instead of the currency symbol. This happens because the Bengali Taka symbol (`৳`) has encoding issues when passed through WhatsApp's URL encoding and messaging system.

This is the same issue that was previously fixed in the PDF receipt generation - the symbol works fine for display in the browser (HTML/React), but causes problems when used in external systems like WhatsApp or PDF generation.

## Root Cause

The WhatsApp message is constructed in `src/pages/Cart.tsx` (lines 315-332) and uses the `৳` symbol directly in multiple places:

```typescript
const itemsList = items
  .map((item) => `... - ৳${item.price * item.quantity}`)
  .join("\n");

const message = encodeURIComponent(
  `💰 *Subtotal:* ৳${subtotal}\n` +
  `🚚 *Delivery:* ৳${deliveryCharge}\n` +
  `🎟️ *Discount:* -৳${totalDiscount}\n` +
  `✅ *Total:* ৳${total}`
);
```

## Solution

Replace the Bengali Taka symbol (`৳`) with `Tk.` (or `BDT`) in the WhatsApp message only. This is consistent with the fix already applied to the receipt generation edge function.

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Cart.tsx` | Replace `৳` with `Tk.` in the WhatsApp message construction (lines 315-332) |

## Implementation Details

Update the WhatsApp message construction to use `Tk.` instead of `৳`:

```typescript
const itemsList = items
  .map((item) => `• ${item.name}${item.size ? ` (Size: ${item.size})` : ""} x${item.quantity} - Tk.${item.price * item.quantity}`)
  .join("\n");

const message = encodeURIComponent(
  `🛍️ *New Order from Unity Collection*\n\n` +
    `📋 *Order ID:* ${order.order_id}\n` +
    `👤 *Name:* ${order.customer_name}\n` +
    `📞 *Phone:* ${order.phone}\n` +
    `📍 *Address:* ${order.address}\n` +
    `🚚 *Delivery:* ${order.delivery_area === "dhaka" ? "Inside Rajshahi" : "Outside Rajshahi"}\n\n` +
    `🛒 *Products:*\n${itemsList}\n\n` +
    `💰 *Subtotal:* Tk.${subtotal}\n` +
    `🚚 *Delivery:* Tk.${deliveryCharge}\n` +
    (totalDiscount > 0 ? `🎟️ *Discount:* -Tk.${totalDiscount}\n` : "") +
    (validatedReferral ? `👥 *Referral:* ${validatedReferral}\n` : "") +
    `✅ *Total:* Tk.${total}`
);
```

## Important Note

The `৳` symbol will continue to work correctly for:
- UI display in the browser (product cards, cart page, etc.)
- All React components

The `Tk.` replacement is ONLY for external systems like:
- WhatsApp messages
- PDF receipts

## Testing After Implementation

1. Add products to cart
2. Fill in customer details
3. Complete checkout
4. Verify the WhatsApp message shows `Tk.` instead of `�` for all prices
5. Confirm all price values display correctly
