import { motion } from "framer-motion";

const WHATSAPP_NUMBER = "8801880545357";

/**
 * WhatsApp icon SVG — official mark colors stay legible on the green bubble.
 */
function WhatsAppGlyph({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.638 3.41 4.673 4.397.616.3 2.06.967 2.74.967.5 0 2.107-.27 2.46-.63.353-.37.353-.66.353-.945-.003-.27-.04-.532-.218-.66-.358-.273-1.1-.55-1.658-.913zM16.097 28.467c-2.207 0-4.358-.616-6.218-1.78l-4.32 1.13 1.13-4.32C5.6 21.493 4.95 19.343 4.95 17.137c0-6.157 5-11.157 11.158-11.157 6.157 0 11.157 5 11.157 11.157 0 6.158-5 11.158-11.158 11.158z" />
    </svg>
  );
}

export function FloatingWhatsApp() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <motion.a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      // On mobile (where the BottomNav lives), float above the nav (~64px tall + safe-area).
      // On desktop, sit at the standard 24px from the bottom-right.
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-50 inline-flex items-center justify-center h-12 w-12 md:h-14 md:w-auto md:gap-2 md:px-4 md:py-3 rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.55)] hover:bg-[#1DB954] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 transition-colors"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppGlyph className="h-6 w-6 md:h-7 md:w-7" />
      <span className="hidden md:inline font-medium text-sm">Chat with us</span>

      {/* Pulse ring for attention; respects prefers-reduced-motion via global rule. */}
      <span className="pointer-events-none absolute inset-0 rounded-full">
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" />
      </span>
    </motion.a>
  );
}
