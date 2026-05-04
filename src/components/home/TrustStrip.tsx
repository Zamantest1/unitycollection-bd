import { ShieldCheck, Truck, Banknote, RotateCcw } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "100% Authentic",
    sub: "Hand-checked quality",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    sub: "Rajshahi 1–2 days",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    sub: "Pay when you receive",
  },
  {
    icon: RotateCcw,
    title: "Easy Exchange",
    sub: "Wrong size? Swap it.",
  },
];

/**
 * Slim trust strip — sits right under the hero so the value prop
 * is the first thing customers see when they scroll. Subtle gold
 * border, no heavy color, won't fight the brand palette.
 */
export function TrustStrip() {
  return (
    <section
      aria-label="Why shop with us"
      className="bg-card border-y border-gold/15"
    >
      <div className="container mx-auto px-4">
        <ul className="grid grid-cols-2 md:grid-cols-4">
          {items.map((it, i) => (
            <li
              key={it.title}
              className={`flex items-center gap-3 py-3 md:py-4 ${
                i < items.length - 1
                  ? "md:border-r border-gold/15"
                  : ""
              } ${i % 2 === 0 ? "border-r border-gold/15 md:border-r" : ""} ${
                i < 2 ? "border-b md:border-b-0 border-gold/15" : ""
              } px-3 md:px-4`}
            >
              <span className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                <it.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm md:text-base font-semibold text-foreground leading-tight">
                  {it.title}
                </p>
                <p className="text-[11px] md:text-xs text-muted leading-snug">
                  {it.sub}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
