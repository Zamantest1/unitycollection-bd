import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buildCategoryShopPath } from "@/lib/slug";

interface CategoryWithCount {
  id: string;
  name: string;
  image_url: string | null;
  count: number;
}

export function CategoryLinks() {
  const { data: categories = [] } = useQuery<CategoryWithCount[]>({
    queryKey: ["categories-with-count"],
    queryFn: async () => {
      const [{ data: cats, error: cErr }, { data: prods, error: pErr }] = await Promise.all([
        supabase.from("categories").select("id, name, image_url").order("name"),
        supabase
          .from("products")
          .select("category_id")
          .eq("is_active", true),
      ]);
      if (cErr) throw cErr;
      if (pErr) throw pErr;
      const counts = new Map<string, number>();
      (prods ?? []).forEach((p: { category_id: string | null }) => {
        if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
      });
      return (cats ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        image_url: c.image_url,
        count: counts.get(c.id) ?? 0,
      }));
    },
  });

  if (categories.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-gold-soft/20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[11px] md:text-xs uppercase tracking-[0.25em] text-gold mb-1">
              Curated for him
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Shop by <span className="text-gold">Category</span>
            </h2>
          </div>
          <Link
            to="/categories"
            className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-gold transition-colors"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile: horizontal snap-scroll rail. Desktop: grid. */}
        <div
          className="md:hidden -mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          aria-label="Categories"
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              to={buildCategoryShopPath(category)}
              className="snap-start shrink-0 w-40"
            >
              <CategoryTile category={category} />
            </Link>
          ))}
        </div>

        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Link to={buildCategoryShopPath(category)}>
                <CategoryTile category={category} />
              </Link>
            </motion.div>
          ))}
        </div>

        <Link
          to="/categories"
          className="md:hidden mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-gold transition-colors"
        >
          See all categories <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function CategoryTile({ category }: { category: CategoryWithCount }) {
  return (
    <div className="group relative aspect-[4/5] md:aspect-square overflow-hidden rounded-2xl border border-gold/20 shadow-sm hover:shadow-md transition-shadow">
      {category.image_url ? (
        <img
          src={category.image_url}
          alt={category.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-gradient-primary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/30 to-transparent" />
      <div className="absolute inset-0 ring-0 ring-gold/0 group-hover:ring-2 group-hover:ring-gold/60 rounded-2xl transition-all" />
      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-base md:text-lg font-semibold text-primary-foreground group-hover:text-gold transition-colors truncate">
              {category.name}
            </h3>
            <p className="text-[11px] md:text-xs text-primary-foreground/80">
              {category.count} {category.count === 1 ? "item" : "items"}
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold text-gold-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
