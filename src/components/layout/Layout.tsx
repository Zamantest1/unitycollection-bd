import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { NoticeBar } from "@/components/home/NoticeBar";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
  showNotice?: boolean;
}

export function Layout({ children, showNotice = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showNotice && <NoticeBar />}
      <Header />
      {/* Pad bottom on mobile so the BottomNav doesn't cover content */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      {/* Desktop keeps the floating WhatsApp bubble; mobile uses BottomNav. */}
      <div className="hidden md:block">
        <FloatingWhatsApp />
      </div>
      <BottomNav />
    </div>
  );
}
