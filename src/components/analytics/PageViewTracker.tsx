import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "uc_visitor_session_id";
const THROTTLE_KEY = "uc_visitor_seen_paths";
const THROTTLE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate (or read) a stable per-tab visitor session id.
 *
 * We deliberately use sessionStorage rather than localStorage so closing the
 * tab counts as a new session. This keeps the metric "unique visitors" close
 * to what most analytics tools mean by it without setting a long-lived cookie.
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "no-storage";
  }
}

/**
 * Returns true if we should track this path right now and remembers the
 * timestamp so we don't track it again within the throttle window.
 *
 * This is the lever that keeps Supabase write volume low: a single user
 * refreshing the same page repeatedly only generates one row per hour.
 */
function shouldTrack(path: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(THROTTLE_KEY);
    const now = Date.now();
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    const last = map[path];
    if (typeof last === "number" && now - last < THROTTLE_WINDOW_MS) {
      return false;
    }
    map[path] = now;
    window.sessionStorage.setItem(THROTTLE_KEY, JSON.stringify(map));
    return true;
  } catch {
    return true;
  }
}

/**
 * Fire-and-forget page view tracker. Mounted once at the App root and
 * listens to react-router location changes. Admin pages are skipped so
 * the dashboard isn't measuring the team's own clicks.
 */
export function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/admin")) return;
    if (!shouldTrack(path)) return;

    const sessionId = getSessionId();
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "";
    const referrer =
      typeof document !== "undefined" ? document.referrer || "" : "";

    void supabase
      .rpc("track_page_view", {
        p_path: path,
        p_session_id: sessionId,
        p_user_agent: userAgent,
        p_referrer: referrer,
      })
      .then(() => {
        // Silently ignore errors — we don't want analytics to disturb UX.
      });
  }, [location.pathname]);

  return null;
}
