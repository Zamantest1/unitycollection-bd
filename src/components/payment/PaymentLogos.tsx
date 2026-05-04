import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Row of accepted-payment marks. Uses the real bKash / Nagad / Rocket
 * SVG logos served from /public/payment/. Each mark sits on a white
 * pill so the brand colors stay legible on dark or light backgrounds.
 *
 * `variant`:
 *  - `chip` (default): compact pill row used in the footer / cart.
 *  - `card`: larger card row used inside the (future) payment page.
 */
interface PaymentLogosProps {
  variant?: "chip" | "card";
  showCod?: boolean;
  className?: string;
}

const methods = [
  {
    key: "bkash",
    label: "bKash",
    src: "/payment/bkash.svg",
    alt: "bKash mobile financial service",
  },
  {
    key: "nagad",
    label: "Nagad",
    src: "/payment/nagad.svg",
    alt: "Nagad digital financial service",
  },
  {
    key: "rocket",
    label: "Rocket",
    src: "/payment/rocket.svg",
    alt: "Dutch-Bangla Rocket mobile banking",
  },
];

export function PaymentLogos({
  variant = "chip",
  showCod = true,
  className,
}: PaymentLogosProps) {
  const isCard = variant === "card";

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-2",
        isCard ? "gap-3" : "gap-2",
        className,
      )}
      aria-label="Accepted payment methods"
    >
      {showCod && (
        <li
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border bg-white text-[#0F4D45]",
            isCard
              ? "px-3 py-1.5 text-sm border-gold/40"
              : "px-2.5 py-1 text-[11px] border-gold/30",
          )}
        >
          <Banknote
            className={cn(isCard ? "h-4 w-4" : "h-3.5 w-3.5", "text-[#0F4D45]")}
            aria-hidden
          />
          <span className="font-semibold">Cash on Delivery</span>
        </li>
      )}
      {methods.map((m) => (
        <li
          key={m.key}
          className={cn(
            "inline-flex items-center justify-center rounded-md bg-white border border-gold/30 shadow-sm",
            isCard ? "h-10 px-3" : "h-7 px-2.5",
          )}
        >
          <img
            src={m.src}
            alt={m.alt}
            loading="lazy"
            decoding="async"
            className={cn("w-auto select-none", isCard ? "h-6" : "h-4")}
          />
          <span className="sr-only">{m.label}</span>
        </li>
      ))}
    </ul>
  );
}
