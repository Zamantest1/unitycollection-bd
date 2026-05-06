// URL slug helpers for products and categories.
//
// The site never had a `slug` column on either table, so we generate
// slugs on the fly from `name` and embed the row's UUID at the end of
// the slug as a discriminator.  This keeps URLs human-readable for
// sharing while remaining 100% backwards-compatible:
//
//   /product/black-cotton-punjabi--<uuid>          (new)
//   /product/<uuid>                                (legacy — still works)
//
//   /shop?category=eid-collection                  (new — slug only,
//                                                   resolved against the
//                                                   loaded category list)
//   /shop?category=<uuid>                          (legacy — still works
//                                                   because lookup falls
//                                                   back to UUID match)

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Convert a name to a URL-safe slug.  Removes diacritics, lowercases,
 * replaces non-alphanumerics with hyphens, collapses runs of hyphens.
 */
export function slugify(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toString()
    .normalize("NFKD")
    // strip combining marks left over from NFKD
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    // anything that isn't a-z0-9 becomes a hyphen
    .replace(/[^a-z0-9]+/g, "-")
    // trim leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // collapse repeated hyphens
    .replace(/-{2,}/g, "-")
    // keep URLs reasonable
    .slice(0, 80);
}

/**
 * Build a product URL of the form `/product/<slug>--<uuid>`.  Falls
 * back to `/product/<uuid>` if the name produces an empty slug.
 */
export function buildProductPath(product: { id: string; name?: string | null }): string {
  const slug = slugify(product.name ?? "");
  if (!slug) return `/product/${product.id}`;
  return `/product/${slug}--${product.id}`;
}

/**
 * Pull a UUID out of a `:id` route param.  Accepts either:
 *   - a bare UUID                           (legacy)
 *   - a slug-with-trailing-uuid             (new format)
 * Returns `null` if no UUID can be extracted.
 */
export function extractIdFromParam(param: string | null | undefined): string | null {
  if (!param) return null;
  const m = param.match(UUID_RE);
  return m ? m[0].toLowerCase() : null;
}

/**
 * Build a category URL.  We always emit slug-only URLs; the storefront
 * resolves the slug back to a UUID by scanning its already-cached
 * category list.  UUIDs are still accepted on input for old links.
 */
export function buildCategoryShopPath(category: { id: string; name?: string | null }): string {
  const slug = slugify(category.name ?? "");
  return `/shop?category=${slug || category.id}`;
}

/**
 * Resolve a `category` URL parameter to a category UUID using the
 * already-loaded list.  Accepts either a slug or a UUID.  Returns
 * `null` if nothing matches.
 */
export function resolveCategoryParam(
  param: string | null | undefined,
  categories: Array<{ id: string; name: string | null }>,
): string | null {
  if (!param) return null;
  // Direct UUID match first — handles legacy links and the case where
  // the categories list hasn't loaded yet.
  if (UUID_RE.test(param)) {
    const direct = categories.find((c) => c.id === param);
    if (direct) return direct.id;
    // Even if the category list isn't loaded yet, hand the UUID back so
    // the products query can still filter by category_id.
    return param;
  }
  // Otherwise treat the param as a slug.
  const wanted = param.toLowerCase();
  const hit = categories.find((c) => slugify(c.name) === wanted);
  return hit ? hit.id : null;
}
