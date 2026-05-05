/**
 * Editorial Spotlight — admin-editable promo card on the homepage.
 *
 * Stored in the `settings` table under the key `editorial_spotlight`.
 * Loaded by the storefront component and edited from
 * `/admin/storefront`.
 *
 * `presetKey` selects a colour theme; if it's `custom` the explicit
 * `colors` block is used instead. Either way, copy text + visibility +
 * CTA targets are independent of the theme.
 */

export const SPOTLIGHT_SETTING_KEY = "editorial_spotlight";

export interface SpotlightColors {
  /** Gradient start (top-left) */
  bgFrom: string;
  /** Gradient end (bottom-right) */
  bgTo: string;
  /** Body text + headline color */
  textColor: string;
  /** Highlighted word inside the headline */
  highlight: string;
  /** Eyebrow micro-label color */
  eyebrow: string;
  /** Primary CTA fill */
  ctaPrimaryBg: string;
  /** Primary CTA text */
  ctaPrimaryFg: string;
}

export interface SpotlightSettings {
  enabled: boolean;
  eyebrow: string;
  headlinePrefix: string;
  headlineHighlight: string;
  headlineSuffix: string;
  subtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  presetKey: SpotlightPresetKey;
  /** Used only when presetKey === "custom" */
  colors: SpotlightColors;
}

export type SpotlightPresetKey =
  | "midnight_gold"
  | "wine_gold"
  | "emerald_lantern"
  | "crimson_marigold"
  | "velvet_plum"
  | "pure_gold"
  | "slate_minimal"
  | "custom";

interface PresetMeta {
  key: SpotlightPresetKey;
  label: string;
  description: string;
  colors: SpotlightColors;
}

/**
 * Curated themes admins can pick from. Each preset is a complete colour
 * set so swapping presets in the admin instantly re-skins the card —
 * no fiddly per-colour tuning required.
 */
export const SPOTLIGHT_PRESETS: PresetMeta[] = [
  {
    key: "midnight_gold",
    label: "Eid · Midnight Gold",
    description: "Deep navy with a warm gold sheen.",
    colors: {
      bgFrom: "#1A2541",
      bgTo: "#0E1730",
      textColor: "#F8F6F2",
      highlight: "#E5B868",
      eyebrow: "#E5B868",
      ctaPrimaryBg: "#E5B868",
      ctaPrimaryFg: "#1A2541",
    },
  },
  {
    key: "wine_gold",
    label: "Eid · Wine & Gold",
    description: "Rich burgundy with champagne accents.",
    colors: {
      bgFrom: "#5B1B2F",
      bgTo: "#2E0F1B",
      textColor: "#FAF1E4",
      highlight: "#F1C77E",
      eyebrow: "#F1C77E",
      ctaPrimaryBg: "#F1C77E",
      ctaPrimaryFg: "#3A0F1F",
    },
  },
  {
    key: "emerald_lantern",
    label: "Ramadan · Emerald Lantern",
    description: "Deep emerald with gold filament — the original look.",
    colors: {
      bgFrom: "#0F4D45",
      bgTo: "#0B3A34",
      textColor: "#F8F6F2",
      highlight: "#E5B868",
      eyebrow: "#E5B868",
      ctaPrimaryBg: "#E5B868",
      ctaPrimaryFg: "#0B3A34",
    },
  },
  {
    key: "crimson_marigold",
    label: "Pohela Boishakh · Crimson Marigold",
    description: "Festive red with marigold amber.",
    colors: {
      bgFrom: "#A11C24",
      bgTo: "#5A0E11",
      textColor: "#FFF5E1",
      highlight: "#F2A93B",
      eyebrow: "#F2A93B",
      ctaPrimaryBg: "#F2A93B",
      ctaPrimaryFg: "#5A0E11",
    },
  },
  {
    key: "velvet_plum",
    label: "Winter · Velvet Plum",
    description: "Plum body with dusty rose accents.",
    colors: {
      bgFrom: "#3F1B45",
      bgTo: "#221026",
      textColor: "#F7E9F2",
      highlight: "#E9A6C4",
      eyebrow: "#E9A6C4",
      ctaPrimaryBg: "#E9A6C4",
      ctaPrimaryFg: "#3F1B45",
    },
  },
  {
    key: "pure_gold",
    label: "Pure Gold",
    description: "Cream backdrop with gold typography — luxury minimal.",
    colors: {
      bgFrom: "#F4E5C2",
      bgTo: "#E5C988",
      textColor: "#3D2A06",
      highlight: "#7A4F00",
      eyebrow: "#7A4F00",
      ctaPrimaryBg: "#3D2A06",
      ctaPrimaryFg: "#F4E5C2",
    },
  },
  {
    key: "slate_minimal",
    label: "Slate Minimal",
    description: "Quiet slate for off-season periods.",
    colors: {
      bgFrom: "#2B3340",
      bgTo: "#1A1F27",
      textColor: "#F1F2F4",
      highlight: "#9BB2D8",
      eyebrow: "#9BB2D8",
      ctaPrimaryBg: "#9BB2D8",
      ctaPrimaryFg: "#1A1F27",
    },
  },
  {
    key: "custom",
    label: "Custom (advanced)",
    description: "Pick your own gradient, highlight and button colors.",
    colors: {
      bgFrom: "#1A2541",
      bgTo: "#0E1730",
      textColor: "#F8F6F2",
      highlight: "#E5B868",
      eyebrow: "#E5B868",
      ctaPrimaryBg: "#E5B868",
      ctaPrimaryFg: "#1A2541",
    },
  },
];

const PRESET_BY_KEY = new Map<SpotlightPresetKey, PresetMeta>(
  SPOTLIGHT_PRESETS.map((p) => [p.key, p]),
);

export const getPresetColors = (
  key: SpotlightPresetKey,
): SpotlightColors => {
  return (PRESET_BY_KEY.get(key) ?? PRESET_BY_KEY.get("midnight_gold")!).colors;
};

/**
 * Resolve which colour set is actually rendered: explicit `colors`
 * for `custom`, otherwise the preset's bundled colours. We always
 * fall back to a sane preset so the card never renders un-styled.
 */
export const resolveSpotlightColors = (
  s: SpotlightSettings,
): SpotlightColors => {
  if (s.presetKey === "custom") return s.colors;
  return getPresetColors(s.presetKey);
};

export const DEFAULT_SPOTLIGHT: SpotlightSettings = {
  enabled: true,
  eyebrow: "Eid · Ramadan · Special",
  headlinePrefix: "Heritage-crafted",
  headlineHighlight: "Punjabi",
  headlineSuffix: "for the modern Bangladeshi gentleman.",
  subtitle: "Premium fabrics, refined cuts, detailing that lasts.",
  ctaPrimaryLabel: "Shop now",
  ctaPrimaryHref: "/shop",
  ctaSecondaryLabel: "Categories",
  ctaSecondaryHref: "/categories",
  presetKey: "midnight_gold",
  colors: getPresetColors("midnight_gold"),
};

/**
 * Older rows in the settings table may be missing newer fields. This
 * normaliser merges the stored payload onto DEFAULT_SPOTLIGHT so the
 * UI always has every field, and so admin saves never blank out
 * unrelated keys by accident.
 */
export const normaliseSpotlight = (
  raw: unknown,
): SpotlightSettings => {
  if (!raw || typeof raw !== "object") return DEFAULT_SPOTLIGHT;
  const r = raw as Partial<SpotlightSettings>;
  const presetKey: SpotlightPresetKey =
    r.presetKey && PRESET_BY_KEY.has(r.presetKey)
      ? r.presetKey
      : DEFAULT_SPOTLIGHT.presetKey;
  return {
    enabled: typeof r.enabled === "boolean" ? r.enabled : DEFAULT_SPOTLIGHT.enabled,
    eyebrow: r.eyebrow ?? DEFAULT_SPOTLIGHT.eyebrow,
    headlinePrefix: r.headlinePrefix ?? DEFAULT_SPOTLIGHT.headlinePrefix,
    headlineHighlight: r.headlineHighlight ?? DEFAULT_SPOTLIGHT.headlineHighlight,
    headlineSuffix: r.headlineSuffix ?? DEFAULT_SPOTLIGHT.headlineSuffix,
    subtitle: r.subtitle ?? DEFAULT_SPOTLIGHT.subtitle,
    ctaPrimaryLabel: r.ctaPrimaryLabel ?? DEFAULT_SPOTLIGHT.ctaPrimaryLabel,
    ctaPrimaryHref: r.ctaPrimaryHref ?? DEFAULT_SPOTLIGHT.ctaPrimaryHref,
    ctaSecondaryLabel: r.ctaSecondaryLabel ?? DEFAULT_SPOTLIGHT.ctaSecondaryLabel,
    ctaSecondaryHref: r.ctaSecondaryHref ?? DEFAULT_SPOTLIGHT.ctaSecondaryHref,
    presetKey,
    colors: {
      ...getPresetColors(presetKey),
      ...(r.colors ?? {}),
    },
  };
};
