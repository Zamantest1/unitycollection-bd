

# Implementation Plan: Homepage Banner Slideshow & Updates

## Overview
This plan covers three main tasks:
1. Enhanced homepage banner with image slideshow and customizable overlays
2. Update delivery text from "Dhaka" to "Rajshahi"
3. Create admin user account

---

## Task 1: Homepage Banner Slideshow with Overlay Options

### Database Changes
Add a new column to the `banners` table to support overlay selection:

```text
+------------------+
|     banners      |
+------------------+
| (existing cols)  |
| + overlay_type   |  <- NEW: 'green' | 'gold' | 'none'
+------------------+
```

**Migration SQL:**
```sql
ALTER TABLE banners 
ADD COLUMN overlay_type text DEFAULT 'green' 
CHECK (overlay_type IN ('green', 'gold', 'none'));
```

### Frontend Changes

**1. Update HeroBanner.tsx**
- Keep current slideshow logic (already working)
- Add dynamic overlay based on `overlay_type` from database:
  - `green`: Dark green gradient overlay (current default)
  - `gold`: Gold/amber gradient overlay
  - `none`: Subtle dark overlay for text readability
- Maintain default green background when no banners exist
- Ensure responsive sizing for mobile and desktop

**2. Update AdminBanners.tsx**
- Add overlay type selector (dropdown with Green/Gold/None options)
- Preview of overlay effect when selecting
- Update form to include overlay_type field

### Visual Design
```text
+------------------------------------------+
|  Homepage Banner with Slideshow          |
+------------------------------------------+
|                                          |
|  [Background Image - Auto-slides]        |
|  +------------------------------------+  |
|  |  Overlay Layer (Green/Gold/None)  |  |
|  |  +------------------------------+ |  |
|  |  |  Title Text                  | |  |
|  |  |  Subtitle                    | |  |
|  |  |  [Shop Now Button]           | |  |
|  |  +------------------------------+ |  |
|  +------------------------------------+  |
|                                          |
|  [Dots Navigation]  [< >] Arrows         |
+------------------------------------------+
```

---

## Task 2: Location Updates (Dhaka → Rajshahi)

### Files to Update

| File | Change |
|------|--------|
| `src/components/home/WhyChooseUs.tsx` | "Dhaka: 1-2 days" → "Rajshahi: 1-2 days" |
| `src/components/product/OrderForm.tsx` | "Inside Dhaka" → "Inside Rajshahi", "Outside Dhaka" → "Outside Rajshahi" |
| `index.html` | Meta description: "Free delivery in Dhaka" → "Free delivery in Rajshahi" |

---

## Task 3: Admin User Setup

### Process
1. Create user in Supabase Auth with:
   - Email: `unitycollectionbd@gmail.com`
   - Password: `unitycollectionbd2024`

2. Add admin role to `user_roles` table:
   - Link user_id to the new user
   - Set role = 'admin'

### Note
This requires using Supabase Admin API to create the user, then inserting the role record. The user will be able to log in at `/admin/login` after setup.

---

## Technical Summary

### Database Migration
```sql
-- Add overlay_type to banners
ALTER TABLE banners 
ADD COLUMN overlay_type text DEFAULT 'green' 
CHECK (overlay_type IN ('green', 'gold', 'none'));
```

### Files to Modify
1. `src/components/home/HeroBanner.tsx` - Add overlay type rendering
2. `src/pages/admin/AdminBanners.tsx` - Add overlay selector
3. `src/components/home/WhyChooseUs.tsx` - Update delivery text
4. `src/components/product/OrderForm.tsx` - Update delivery area labels
5. `index.html` - Update meta description

### Admin User Creation
- Will use Supabase to create auth user and assign admin role

---

## Expected Result
- Homepage shows image slideshow (if banners exist) with selectable green/gold/no overlay
- Falls back to green background when no banners configured
- All "Dhaka" references changed to "Rajshahi"
- Admin can log in with `unitycollectionbd@gmail.com` / `unitycollectionbd2024`

