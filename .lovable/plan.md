

# Unity Collection - Complete E-commerce System

## Brand Identity & Design System

### Color Palette
- **Primary Dark Green** `#0F4D45` - Headers, buttons, highlights
- **Secondary Deep Green** `#0B3A34` - Navbar, footer, admin sidebar
- **Gold Accent** `#C9A24D` - Price highlights, offers, icons, badges
- **Soft Gold** `#E8D9A8` - Subtle backgrounds, dividers, cards
- **Off-White Background** `#F8F6F2` - Main page backgrounds
- **Text Dark** `#1E1E1E` - Body text
- **Muted Gray** `#6B7280` - Secondary text, labels

### Typography
- **Playfair Display** - Product titles, section headings, hero text
- **Inter** - Descriptions, buttons, forms, admin UI

### Design Principles
- Premium Bangladeshi traditional aesthetic
- Mobile-first, compact layouts
- Gold as accent only, green as dominant brand signal
- Smooth, subtle transitions (no flashy animations)

---

## Customer Storefront

### Homepage
- **Header** - Logo, navigation, mobile menu
- **Scrolling Notice Bar** - Marquee announcements (admin toggleable)
- **Hero Banner Slider** - Rotating banners with elegant text overlays
- **Featured Products** - Premium product showcase grid
- **Category Quick Links** - Visual category cards with gold accents
- **Why Choose Us** - Compact trust badges (minimal height)
- **Footer** - Logo, contact info, social links in deep green

### Shop Page
- **Product Grid** - Responsive cards with Playfair titles, gold price highlights
- **Category Filter** - Collapsible on mobile, auto-closes after selection
- **Search Bar** - Real-time product filtering
- **Discount Badges** - Gold accent badges for sale items

### Product Detail Page
- **Image Gallery** - Multiple images with elegant navigation
- **Product Info** - Name in Playfair, description in Inter
- **Size Selector** - Clean pill-style options
- **Price Display** - Gold-highlighted with discount strikethrough
- **Order Form** - Name, phone, address, delivery area
- **Coupon Input** - Validation with visual feedback
- **WhatsApp Order Button** - Dark green with gold hover

### Order Flow
1. Form validation → Order saved to Supabase
2. Unique Order ID generated (UC-XXXX format)
3. Status set to "pending"
4. WhatsApp redirect with complete order details

---

## Admin Panel

### Authentication
- **Login Page** (`/admin/login`) - Branded with logo, dark green theme
- **Protected Routes** - All admin routes require Supabase auth
- **Logout** - Session clear with redirect

### Dashboard
- Deep green sidebar with gold active states
- Quick stats cards (orders, products, revenue)
- Recent orders overview

### Product Management
- Add/Edit/Delete products
- Multi-image Cloudinary upload
- Category assignment, pricing, discounts
- Size variants configuration
- Search and category filter

### Category Management
- Create, rename, delete categories
- Optional category images
- Instant frontend updates

### Banner Management
- Upload hero banners via Cloudinary
- Edit title/subtitle text
- Enable/disable toggles
- Drag-to-reorder sequence

### Notice Bar Settings
- Edit scrolling text content
- Toggle visibility on/off

### Coupon System
- Create codes with fixed/percentage discounts
- Set minimum purchase, expiry dates
- Active/inactive toggle
- Usage tracking

### Order Management
- Full order list with search
- Filter by status (pending, confirmed, shipped, delivered, cancelled)
- Order detail view with breakdown
- Status update actions

---

## Database Structure (Supabase)

### Tables
- **categories** - id, name, image_url, created_at
- **products** - id, name, description, price, discount_price, category_id, sizes[], image_urls[], is_featured, created_at
- **banners** - id, image_url, title, subtitle, link, is_active, display_order
- **notice_settings** - id, text, is_active
- **coupons** - id, code, discount_type, discount_value, min_purchase, expiry_date, is_active, usage_count
- **orders** - id, order_id, customer_name, phone, address, delivery_area, items[], subtotal, discount_amount, coupon_code, total, status, created_at

### Row Level Security
- Public: Read products, categories, banners, active notices
- Public: Insert orders, validate coupons
- Admin only: All write operations, read orders

---

## Technical Implementation

### Image Handling (Cloudinary)
- Upload with automatic compression
- Responsive image transformations
- URL-only storage in database
- Cleanup on product deletion

### WhatsApp Integration
- Environment variable for number
- Pre-formatted order message with:
  - Order ID, customer details
  - Product list with sizes and prices
  - Discount breakdown, total
  - Product links

### Mobile Optimization
- Products visible immediately on shop page
- Collapsed category filter by default
- Touch-optimized buttons and forms
- Fast-loading optimized images

---

## Setup After Implementation

1. **Enable Supabase** - Connect database backend
2. **Add Secrets** - Cloudinary keys, WhatsApp number
3. **Create Admin User** - Via Supabase Auth dashboard
4. **Run Migrations** - Create all database tables
5. **Upload Initial Content** - Logo, banners, products

