

# Fix: Members Settings Icon & Banner Edit Form Issues

## Issues Identified

### Issue 1: Settings Icon Not Visible in Members Page
**Location:** `src/pages/admin/AdminMembers.tsx` (lines 253-260)

**Problem:** The TabsTrigger component uses the `text-muted-foreground` color class, which makes the icon appear very light/gray. When the "Settings" tab is inactive, the icon color blends with the background, making it nearly invisible.

**Current Code:**
```tsx
<TabsTrigger value="settings" className="flex items-center gap-2">
  <Settings className="h-4 w-4" />
  Settings
</TabsTrigger>
```

**Fix:** Add explicit color styling to ensure the icon is always visible, using `currentColor` inheritance or explicit foreground colors.

---

### Issue 2: Banner Edit Form - Save Button Not Visible
**Location:** `src/pages/admin/AdminBanners.tsx` (lines 120-197)

**Problem:** The Dialog content has no height constraint or overflow handling. When the form content (especially with the ImageUpload component taking ~160px) exceeds the viewport height, the bottom buttons get cut off and are not accessible. The user cannot scroll within the dialog to reach the Save/Update button.

**Current Code:**
```tsx
<DialogContent className="max-w-lg">
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* ... many form fields ... */}
    <div className="flex gap-2 justify-end pt-4">
      <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
      <Button type="submit" ...>Update</Button>
    </div>
  </form>
</DialogContent>
```

**Fix:** Add `max-h-[90vh] overflow-y-auto` to make the dialog scrollable, ensuring users can always access the save button.

---

## Implementation Plan

### Step 1: Fix Settings Tab Icon Visibility
**File:** `src/pages/admin/AdminMembers.tsx`

**Changes:**
- Update both TabsTrigger components to ensure icons have proper visibility
- Add `text-muted-foreground data-[state=active]:text-foreground` classes to ensure icon visibility in both states
- Alternatively, ensure icons inherit `currentColor` properly

### Step 2: Fix Banner Dialog Scrollability
**File:** `src/pages/admin/AdminBanners.tsx`

**Changes:**
- Add `max-h-[85vh] overflow-y-auto` to DialogContent
- Ensure the form footer (Cancel/Save buttons) is always visible
- Consider making the footer sticky at the bottom

---

## Technical Details

### AdminMembers.tsx Changes
```tsx
// Update TabsTrigger components (around lines 253-260)
<TabsTrigger value="members" className="flex items-center gap-2">
  <CreditCard className="h-4 w-4" />
  Members
</TabsTrigger>
<TabsTrigger value="settings" className="flex items-center gap-2">
  <Settings className="h-4 w-4" />
  Settings
</TabsTrigger>
```

The issue is that icons use `currentColor` by default, but the tab trigger text color might not be set properly. We'll ensure the icon inherits the correct color.

### AdminBanners.tsx Changes
```tsx
// Update DialogContent (around line 120)
<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
```

This ensures:
- Dialog never exceeds 85% of viewport height
- Content is scrollable when it overflows
- Buttons are always accessible

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/AdminMembers.tsx` | Ensure Settings icon has visible color in TabsTrigger |
| `src/pages/admin/AdminBanners.tsx` | Add max-height and overflow-y-auto to DialogContent for scrollability |

---

## Testing After Implementation

1. **Members Page:**
   - Navigate to Admin > Members
   - Verify both "Members" and "Settings" tabs show their icons clearly
   - Toggle between tabs to ensure icons remain visible in both active and inactive states

2. **Banners Page:**
   - Navigate to Admin > Banners
   - Click "Add Banner" or edit an existing banner
   - Upload an image and fill in form fields
   - Verify the dialog is scrollable and Cancel/Update buttons are visible
   - Confirm form submission works correctly

