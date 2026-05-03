import { Layout } from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Categories = () => {
  const { data: categories = [], isLoading } = useQuery({
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

  return (
    <Layout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden bg-secondary py-10 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--gold)/0.24),transparent_34%)]" />
          <div className="relative container mx-auto px-4 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Discover your next look
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground">
              Browse by <span className="text-gold">Category</span>
            </h1>
            <p className="text-primary-foreground/80 mt-3">
              Explore our curated collections
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <h3 className="font-display text-xl md:text-2xl font-semibold text-primary-foreground group-hover:text-gold transition-colors">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-primary-foreground/75 opacity-0 transition-opacity group-hover:opacity-100">
                        Explore collection
                      </p>
                    </div>
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold rounded-2xl transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted text-lg">No categories yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
