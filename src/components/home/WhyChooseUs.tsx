import { Truck, Shield, Banknote, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Rajshahi 1–2 days · Nationwide 3–5 days",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Premium fabrics, hand-finished",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    description: "Pay only after you receive",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Support",
    description: "Real humans, fast replies",
  },
];

export function WhyChooseUs() {
  return (
    <section className="relative py-10 md:py-14 overflow-hidden bg-gradient-section border-t border-gold/10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, hsl(var(--gold)) 0, transparent 40%), radial-gradient(circle at 80% 100%, hsl(var(--primary)) 0, transparent 40%)",
        }}
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-7 md:mb-9">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.25em] text-gold mb-2">
            The Unity promise
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Why <span className="text-gold">men in Bangladesh</span> choose us
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              className="group relative rounded-2xl border border-gold/15 bg-card/80 backdrop-blur-sm p-5 md:p-6 text-center shadow-sm hover:shadow-md hover:border-gold/40 transition-all"
            >
              <div className="mx-auto mb-3 md:mb-4 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-inner">
                <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm md:text-base">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-muted mt-1 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
