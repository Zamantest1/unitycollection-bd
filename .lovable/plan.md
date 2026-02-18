

## Fix: Delivery Area Display + Receipt Download

### Issue 1: Delivery Area Shows "Dhaka" Instead of "Rajshahi"

**Root Cause:** The order form stores `"dhaka"` and `"outside"` as raw values in the database (from the Zod enum on line 19 of OrderForm.tsx). The WhatsApp message correctly translates these to "Inside Rajshahi" / "Outside Rajshahi", but the admin order detail modal on line 295 of AdminOrders.tsx just does `capitalize` on the raw value -- so it shows "Dhaka" and "Outside".

**Fix (2 options, recommending Option A):**

**Option A - Update stored values to match reality:**
- Change the Zod enum from `["dhaka", "outside"]` to `["rajshahi", "outside_rajshahi"]`
- Update radio button values accordingly
- Update the WhatsApp message mapping
- Update the receipt edge function mapping
- Update admin display to show human-readable labels

**Option B (simpler) - Just fix the display in admin:**
- Add a helper function in AdminOrders.tsx that maps `"dhaka"` to `"Inside Rajshahi"` and `"outside"` to `"Outside Rajshahi"`
- Apply the same mapping in the receipt edge function (already done there on line 176)

I recommend **Option A** since storing "dhaka" when you mean "rajshahi" is confusing and will cause issues long-term. However, existing orders in the database will still have the old values, so the display helper will handle both old and new values.

**Changes:**
- `src/components/product/OrderForm.tsx`: Change enum values from `"dhaka"/"outside"` to `"rajshahi"/"outside_rajshahi"`, update default value, radio values, delivery charge logic, and WhatsApp message
- `src/pages/admin/AdminOrders.tsx`: Add a `getDeliveryLabel()` helper that maps all values (old + new) to proper labels like "Inside Rajshahi" / "Outside Rajshahi". Use it in the order detail modal.
- `supabase/functions/generate-receipt/index.ts`: Update the delivery area check to handle both old and new values

---

### Issue 2: Receipt Download Fails with Bengali Character Error

**Root Cause:** The edge function logs show: `WinAnsi cannot encode "অ"`. The product names contain Bengali text (e.g., "মিডনাইট স্ট্রাইপ ক্লাসিক পাঞ্জাবি"), and `pdf-lib`'s standard fonts (Helvetica) only support WinAnsi (Latin) characters. Bengali characters crash the PDF generation.

**Fix:** Strip non-Latin characters from text before rendering in the PDF, or replace them with transliterated/simplified versions. Since product names have both English and Bengali parts (e.g., "Midnight Stripe Classic | মিডনাইট স্ট্রাইপ ক্লাসিক পাঞ্জাবি"), we can extract just the English portion before the `|` separator.

**Changes in `supabase/functions/generate-receipt/index.ts`:**
- Add a helper function `sanitizeText()` that removes non-ASCII characters and cleans up the text
- For product names specifically, extract the English part before `|` if present
- Apply `sanitizeText()` to customer name, address, and all text fields that might contain Bengali
- This ensures the PDF generates successfully while keeping the receipt readable

---

### Technical Summary

| File | Change |
|------|--------|
| `src/components/product/OrderForm.tsx` | Update enum values from "dhaka"/"outside" to "rajshahi"/"outside_rajshahi" |
| `src/pages/admin/AdminOrders.tsx` | Add delivery area label mapping function, apply to order detail view |
| `supabase/functions/generate-receipt/index.ts` | Add text sanitization to strip Bengali characters, handle both old/new delivery area values |

