
# PWA Integration for Admin Panel

## Overview
Add Progressive Web App (PWA) capabilities specifically for the admin section, allowing you to install the admin panel as a standalone app on your phone or computer for easier management.

## What You'll Get
- **Installable App**: Download the admin panel directly to your home screen (phone) or desktop
- **Works Offline**: Basic offline support with cached assets
- **App-Like Experience**: Full-screen mode without browser chrome
- **Quick Access**: Launch directly from your device like a native app

## Implementation Steps

### 1. Install PWA Plugin
Add the `vite-plugin-pwa` package to enable PWA functionality.

### 2. Configure Vite for PWA
Update `vite.config.ts` to include the PWA plugin with:
- Admin-focused app name: "Unity Admin"
- Short name for home screen: "UC Admin"
- Admin-specific theme colors (dark theme to match admin panel)
- Start URL pointing to `/admin` so it opens directly to the admin dashboard
- Icons for various device sizes

### 3. Create PWA Icons
Add admin-specific icons to the public folder:
- `admin-icon-192.png` (192x192)
- `admin-icon-512.png` (512x512)
- These will use the Unity Collection logo optimized for app icons

### 4. Add Mobile Meta Tags
Update `index.html` with:
- Apple touch icon for iOS
- Theme color meta tag
- Apple mobile web app capable meta tag

### 5. Create Install Prompt Component
Add an "Install App" button in the Admin Layout that:
- Only shows when the app can be installed (not already installed)
- Triggers the native browser install prompt
- Shows on mobile and desktop
- Disappears after installation

### 6. Register Service Worker
Update `src/main.tsx` to register the PWA service worker for:
- Caching static assets (CSS, JS, images)
- Enabling offline functionality for the admin panel

---

## Technical Details

### PWA Manifest Configuration
```text
┌─────────────────────────────────────┐
│  Unity Admin PWA Manifest           │
├─────────────────────────────────────┤
│  Name: Unity Collection Admin       │
│  Short Name: UC Admin               │
│  Start URL: /admin                  │
│  Display: standalone                │
│  Theme Color: #1a1a2e (dark)        │
│  Background: #16161d                │
│  Scope: /admin                      │
└─────────────────────────────────────┘
```

### Files to Create
| File | Purpose |
|------|---------|
| `public/admin-icon-192.png` | Small app icon |
| `public/admin-icon-512.png` | Large app icon |
| `src/components/admin/InstallPrompt.tsx` | Install button component |
| `src/hooks/usePWAInstall.ts` | Hook to handle install logic |

### Files to Modify
| File | Changes |
|------|---------|
| `vite.config.ts` | Add vite-plugin-pwa configuration |
| `index.html` | Add PWA meta tags |
| `src/main.tsx` | Register service worker |
| `src/components/admin/AdminLayout.tsx` | Add install prompt button |

### Install Button Behavior
The install button will appear in the admin sidebar footer (above "View Store" button):
- Shows a download icon with "Install App" text
- Only visible when browser supports installation and app isn't installed
- Clicking triggers the native "Add to Home Screen" prompt
- Button hides after successful installation

### Offline Support
The service worker will cache:
- All admin page routes
- Static assets (JS, CSS, fonts)
- The Unity Collection logo
- Note: Database operations still require internet connection

---

## How to Install (After Implementation)

**On Mobile (Android):**
1. Go to `/admin/login` and log in
2. Tap the "Install App" button in the sidebar
3. Confirm the installation prompt
4. The app icon appears on your home screen

**On Mobile (iOS):**
1. Open admin panel in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name it and tap Add

**On Desktop (Chrome/Edge):**
1. Go to the admin panel
2. Click the "Install App" button
3. Or click the install icon in the address bar
4. Confirm installation
