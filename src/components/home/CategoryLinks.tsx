import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function CategoryLinks() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  if (categories.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-gold-soft/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
            Curated for every occasion
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Shop by <span className="text-gold">Category</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/shop?category=${category.id}`}
                className="block group relative overflow-hidden rounded-2xl aspect-square shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-secondary" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/95 via-secondary/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-lg md:text-xl font-semibold text-primary-foreground group-hover:text-gold transition-colors">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-xs text-primary-foreground/75 opacity-0 transition-opacity group-hover:opacity-100">
                    Explore collection
                  </p>
                </div>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold rounded-2xl transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
