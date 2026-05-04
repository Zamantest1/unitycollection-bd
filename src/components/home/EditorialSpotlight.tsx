import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Slim editorial slot — single unified gradient band, no inner card.
 * Lives between Categories and Featured.
 */
export function EditorialSpotlight() {
  return (
    <section className="bg-background py-6 md:py-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-emerald-glow text-primary-foreground shadow-[0_20px_45px_-20px_rgba(11,58,52,0.55)] ring-1 ring-gold/15"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(120deg, transparent 60%, hsl(var(--gold)) 60%, hsl(var(--gold)) 60.6%, transparent 60.6%)",
            }}
          />
          <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-8 px-5 py-6 md:px-10 md:py-8">
            <div className="text-center md:text-left flex-1">
              <p className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-gold mb-2">
                <Sparkles className="h-3 w-3" />
                Eid · Ramadan · Special occasions
              </p>
              <h3 className="font-display text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                Heritage-crafted <span className="text-gold">Punjabi</span> for the modern
                Bangladeshi gentleman.
              </h3>
              <p className="text-primary-foreground/85 text-sm md:text-[15px] mt-2 md:mt-3 max-w-xl mx-auto md:mx-0">
                Premium fabrics, refined cuts, detailing that lasts beyond the season.
              </p>
            </div>

            <div className="shrink-0 flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
              <Link to="/shop">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold text-gold-foreground px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-gold/90 transition-colors">
                  Shop the collection
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link to="/categories">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:bg-primary-foreground/10 transition-colors">
                  Browse categories
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
