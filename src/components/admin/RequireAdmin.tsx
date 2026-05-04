import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single admin auth gate. Mounted once at the route level so navigating
 * between admin pages does NOT re-run the role check or flash a spinner.
 *
 * The previous design wrapped every admin page in an <AdminLayout> which
 * each ran its own session + user_roles lookup on mount. With React
 * Router's nested-route layout pattern this guard stays mounted across
 * child route swaps.
 */

type AdminAuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; email: string; userId: string };

interface AdminAuthContextValue {
  email: string;
  userId: string;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside <RequireAdmin />");
  }
  return ctx;
}

export default function RequireAdmin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AdminAuthState>({ status: "loading" });
  const verifiedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        setState({ status: "unauthenticated" });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      if (!role) {
        await supabase.auth.signOut();
        setState({ status: "unauthenticated" });
        return;
      }
      verifiedRef.current = true;
      setState({
        status: "authenticated",
        email: session.user.email ?? "",
        userId: session.user.id,
      });
    };

    void verify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session) {
        verifiedRef.current = false;
        setState({ status: "unauthenticated" });
      } else if (event === "SIGNED_IN" && !verifiedRef.current) {
        // Re-verify role on a fresh sign-in.
        void verify();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (state.status === "unauthenticated") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return (
    <AdminAuthContext.Provider
      value={{ email: state.email, userId: state.userId, logout }}
    >
      <Outlet />
    </AdminAuthContext.Provider>
  );
}
