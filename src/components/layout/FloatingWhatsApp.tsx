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

/**
 * Quiet floating WhatsApp button.
 *
 * Design intent: present but not attention-seeking. No pulse ring, no
 * spring entrance, no desktop pill — just a small circular icon bubble
 * with a soft neutral shadow and a gentle hover lift. The `#25D366`
 * fill is kept so the icon is instantly recognizable as WhatsApp.
 */
export function FloatingWhatsApp() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <motion.a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      // On mobile (BottomNav present) sit above the nav with safe-area
      // respect; on desktop park at a comfortable 24px corner offset.
      className={[
        "fixed bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 z-40",
        "inline-flex items-center justify-center h-11 w-11 md:h-12 md:w-12 rounded-full",
        "bg-[#25D366] text-white",
        "shadow-[0_4px_14px_-4px_rgba(0,0,0,0.18)] ring-1 ring-black/5",
        "hover:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.28)] hover:bg-[#1FBE5C]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
        "transition-[box-shadow,background-color,transform] duration-200",
      ].join(" ")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppGlyph className="h-5 w-5 md:h-6 md:w-6" />
    </motion.a>
  );
}
