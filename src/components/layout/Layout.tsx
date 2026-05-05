import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { NoticeBar } from "@/components/home/NoticeBar";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
  showNotice?: boolean;
  /**
   * When true, the global brand header + notice bar are hidden. Used by
   * the payment flow so its own gradient header isn't stacked on top of
   * the global header. Bottom-nav and footer still render.
   */
  hideHeader?: boolean;
}

export function Layout({
  children,
  showNotice = true,
  hideHeader = false,
}: LayoutProps) {
  const location = useLocation();
  // Hide the floating WhatsApp on /cart and /payment so it doesn't
  // overlap the checkout form / payment submission flow.
  const hideFloatingWA =
    location.pathname.startsWith("/cart") ||
    location.pathname.startsWith("/payment");

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && showNotice && <NoticeBar />}
      {!hideHeader && <Header />}
      {/* Pad bottom on mobile so the BottomNav doesn't cover content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
      {/* Floating WhatsApp — visible on both mobile and desktop, hidden on /cart. */}
      {!hideFloatingWA && <FloatingWhatsApp />}
    </div>
  );
}
