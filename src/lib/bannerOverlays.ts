// Catalogue of overlay presets applied on top of hero banner images.
//
// Each entry is identified by a string `id` which is what we persist to
// `banners.overlay_type` (a free-form text column).  Adding new entries
// does not require a migration; existing rows referencing an unknown id
// fall back to the default overlay via getOverlay().
//
// Used by:
//   • src/pages/admin/AdminBanners.tsx — swatch picker + form preview
//   • src/components/home/HeroBanner.tsx — actual storefront overlay

export interface BannerOverlay {
  id: string;
  label: string;
  /** Solid colour used by the admin swatch chip. */
  swatch: string;
  /** Inline CSS gradient applied as the overlay's background. */
  gradient: string;
}

export const BANNER_OVERLAYS: BannerOverlay[] = [
  {
    id: "green",
    label: "Forest Green",
    swatch: "#0B3A34",
    gradient:
      "linear-gradient(to right, hsla(168, 67%, 13%, 0.8), hsla(168, 67%, 13%, 0.4))",
  },
  {
    id: "gold",
    label: "Royal Gold",
    swatch: "#C99B4F",
    gradient:
      "linear-gradient(to right, hsla(35, 55%, 55%, 0.75), hsla(35, 55%, 55%, 0.3))",
  },
  {
    id: "teal",
    label: "Deep Teal",
    swatch: "#0E5566",
    gradient:
      "linear-gradient(to right, hsla(192, 76%, 23%, 0.8), hsla(192, 76%, 23%, 0.4))",
  },
  {
    id: "navy",
    label: "Midnight Navy",
    swatch: "#0F172A",
    gradient:
      "linear-gradient(to right, hsla(222, 47%, 11%, 0.85), hsla(222, 47%, 11%, 0.4))",
  },
  {
    id: "burgundy",
    label: "Burgundy",
    swatch: "#5B0F16",
    gradient:
      "linear-gradient(to right, hsla(354, 71%, 21%, 0.8), hsla(354, 71%, 21%, 0.4))",
  },
  {
    id: "charcoal",
    label: "Charcoal",
    swatch: "#1F2937",
    gradient:
      "linear-gradient(to right, hsla(217, 19%, 17%, 0.8), hsla(217, 19%, 17%, 0.4))",
  },
  {
    id: "none",
    label: "Soft Dark",
    swatch: "#374151",
    gradient:
      "linear-gradient(to right, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.2))",
  },
];

export const DEFAULT_OVERLAY_ID = "green";

export function getOverlay(id: string | null | undefined): BannerOverlay {
  if (!id) {
    return BANNER_OVERLAYS.find((o) => o.id === DEFAULT_OVERLAY_ID)!;
  }
  return (
    BANNER_OVERLAYS.find((o) => o.id === id) ??
    BANNER_OVERLAYS.find((o) => o.id === DEFAULT_OVERLAY_ID)!
  );
}
