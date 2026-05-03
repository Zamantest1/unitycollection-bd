import { Truck, Shield, CreditCard, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Rajshahi: 1-2 days",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Premium fabrics",
  },
  {
    icon: CreditCard,
    title: "Cash on Delivery",
    description: "Pay when received",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "WhatsApp ready",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-2xl border border-border/70 bg-card/80 p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-full bg-gold-soft flex items-center justify-center mb-3 ring-8 ring-gold-soft/30">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-sm md:text-base">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-muted mt-1">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
