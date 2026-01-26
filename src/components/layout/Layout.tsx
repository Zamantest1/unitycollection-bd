import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { NoticeBar } from "@/components/home/NoticeBar";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

interface LayoutProps {
  children: ReactNode;
  showNotice?: boolean;
}

export function Layout({ children, showNotice = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showNotice && <NoticeBar />}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
