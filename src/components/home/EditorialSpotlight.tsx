import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Static editorial card — Eid / occasion-led merchandising slot.
 * Pure brand visual, no data fetch. Living between Categories and Featured.
 */
export function EditorialSpotlight() {
  return (
    <section className="bg-background py-12 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-primary text-primary-foreground"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle at 85% 20%, hsl(var(--gold)) 0, transparent 50%), radial-gradient(circle at 15% 80%, hsl(var(--gold)) 0, transparent 45%)",
            }}
          />
          <div className="relative grid md:grid-cols-2 items-center gap-6 md:gap-8 p-6 md:p-12">
            <div className="text-center md:text-left">
              <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-gold mb-3">
                Eid · Ramadan · Special occasions
              </p>
              <h3 className="font-display text-2xl md:text-4xl font-bold leading-tight mb-3">
                Heritage-crafted <span className="text-gold">Punjabi</span>
                <br className="hidden md:block" /> for the modern Bangladeshi gentleman.
              </h3>
              <p className="text-primary-foreground/85 text-sm md:text-base mb-6 md:mb-8 max-w-md mx-auto md:mx-0">
                Premium fabrics, refined cuts, and detailing that lasts beyond the season. Made
                in Bangladesh.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link to="/shop">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold text-gold-foreground px-5 py-2.5 text-sm font-semibold shadow-lg hover:bg-gold/90 transition-colors">
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

            <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gold/30">
              <img
                src="https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png"
                alt=""
                aria-hidden
                className="absolute inset-0 m-auto w-1/2 opacity-10"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary to-secondary" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--gold)/0.18)_0%,transparent_60%)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <p className="font-display text-gold text-sm md:text-base uppercase tracking-[0.3em] mb-3">
                  Unity Collection
                </p>
                <p className="font-display text-3xl md:text-5xl font-bold leading-tight">
                  For the man
                  <br />
                  <span className="text-gold">who carries heritage.</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
