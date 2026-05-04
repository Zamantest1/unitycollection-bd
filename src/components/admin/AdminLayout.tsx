import { useState, useEffect, ReactNode } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Image as ImageIcon,
  Tag,
  ShoppingCart,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
  Users,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InstallPrompt } from "./InstallPrompt";

const LOGO_URL =
  "https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  group: "Overview" | "Catalog" | "Customers" | "Marketing";
}

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard, group: "Overview" },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart, group: "Overview" },
  { name: "Products", path: "/admin/products", icon: Package, group: "Catalog" },
  { name: "Categories", path: "/admin/categories", icon: FolderOpen, group: "Catalog" },
  { name: "Banners", path: "/admin/banners", icon: ImageIcon, group: "Catalog" },
  { name: "Members", path: "/admin/members", icon: UserCheck, group: "Customers" },
  { name: "Referrals", path: "/admin/referrals", icon: Users, group: "Customers" },
  { name: "Coupons", path: "/admin/coupons", icon: Tag, group: "Marketing" },
  { name: "Notice Bar", path: "/admin/notice", icon: Bell, group: "Marketing" },
];

const groups: NavItem["group"][] = ["Overview", "Catalog", "Customers", "Marketing"];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!role) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setAdminEmail(session.user.email ?? "");
      setIsLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const adminInitial = (adminEmail[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F4EE] flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-secondary border-r border-sidebar-border shadow-[8px_0_24px_-12px_rgba(11,58,52,0.25)] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-4 py-4 border-b border-sidebar-border flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gradient-gold-strong shadow ring-2 ring-gold/40">
                <img
                  src={LOGO_URL}
                  alt="Unity Collection"
                  className="h-7 w-7 object-contain"
                />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-sidebar-foreground leading-none">
                  Unity Collection
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold leading-none mt-1">
                  Admin
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="lg:hidden text-sidebar-foreground hover:text-gold p-1"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {groups.map((g) => {
              const items = navItems.filter((i) => i.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g} className="space-y-1">
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/50">
                    {g}
                  </p>
                  {items.map((item) => {
                    const isActive =
                      item.path === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-gradient-to-r from-gold/15 to-transparent text-gold"
                            : "text-sidebar-foreground hover:bg-white/5 hover:text-gold",
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gold"
                          />
                        )}
                        <item.icon className="h-4.5 w-4.5 shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Admin profile */}
          <div className="px-4 pt-3 pb-2 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gradient-gold-strong text-gold-foreground font-semibold text-sm">
                {adminInitial}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {adminEmail || "Administrator"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60">Admin</p>
              </div>
            </div>
            <InstallPrompt />
            <Link to="/" className="block mt-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-9 text-sidebar-foreground hover:text-gold hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                View store
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start h-9 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border/60 px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden md:block">
              Unity Collection · Admin
            </p>
            <h1 className="font-display text-lg md:text-xl font-bold text-foreground leading-tight truncate">
              {title}
            </h1>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-gold/40 text-foreground hover:bg-gold/10"
              >
                View store
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
