/**
 * Curated set of starter size-chart images shipped with the storefront.
 * Admins can pick one as a quick stand-in if they don't have their
 * own brand size chart yet — copy the URL into the size-guide field
 * on the product form.
 *
 * Files live in /public/size-guides/ as SVGs so they scale to any
 * resolution and load instantly. Replace any of them by overwriting
 * the corresponding .svg file (or upload a new image and add a row
 * here).
 */

export interface SampleSizeGuide {
  key: string;
  label: string;
  category: "Top wear" | "Bottom wear" | "Footwear" | "Generic";
  /** Public URL relative to the site root. */
  url: string;
}

export const SAMPLE_SIZE_GUIDES: SampleSizeGuide[] = [
  {
    key: "tshirt_in",
    label: "T-Shirt — inches (S/M/L/XL/XXL)",
    category: "Top wear",
    url: "/size-guides/tshirt-in.svg",
  },
  {
    key: "tshirt_cm",
    label: "T-Shirt — centimetres",
    category: "Top wear",
    url: "/size-guides/tshirt-cm.svg",
  },
  {
    key: "panjabi_in",
    label: "Panjabi / Kurta — inches",
    category: "Top wear",
    url: "/size-guides/panjabi-in.svg",
  },
  {
    key: "shirt_in",
    label: "Formal Shirt — inches",
    category: "Top wear",
    url: "/size-guides/shirt-in.svg",
  },
  {
    key: "pant_in",
    label: "Pant / Trouser — inches",
    category: "Bottom wear",
    url: "/size-guides/pant-in.svg",
  },
];

export const findSampleSizeGuide = (
  url: string | undefined | null,
): SampleSizeGuide | undefined => {
  if (!url) return undefined;
  return SAMPLE_SIZE_GUIDES.find((s) => s.url === url);
};
