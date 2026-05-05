import { useEffect, useRef } from "react";

/**
 * Intercept the browser Back button so we can show a confirmation
 * dialog before the user actually leaves the page.
 *
 * Implementation note: react-router v6 only provides `useBlocker`
 * with the Data Router. This app uses the classic BrowserRouter, so
 * we use the standard "push a sentinel state, listen for popstate"
 * trick instead:
 *
 *  - When the interceptor is active, we push a no-op history entry
 *    on top of the current one (same URL, just adds a step to the
 *    back stack).
 *  - When the user presses Back, popstate fires. We immediately
 *    push another sentinel so a *subsequent* Back press also
 *    triggers us, and call `onBack` so the page can show its
 *    dialog.
 *  - The page is responsible for what happens next: typically,
 *    "No" closes the dialog (and does nothing — the sentinel is
 *    already re-armed), and "Yes" performs the cleanup work and
 *    navigates somewhere else explicitly (e.g. `navigate('/')`).
 *
 * On unmount we simply remove the listener; we deliberately leave
 * the sentinel in the back stack rather than trying to pop it,
 * because trying to remove it after the user has navigated forward
 * (e.g. to a sub-route on the same page) lands them on a stale
 * URL. The sentinel has the same URL as the real entry, so leaving
 * it costs at most one extra Back press to fully escape.
 */
export function useBackInterceptor(active: boolean, onBack: () => void) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    let armed = true;

    // Push sentinel: same URL, just adds an entry to the back stack.
    window.history.pushState({ __backInterceptor: true }, "");

    const handler = () => {
      if (!armed) return;
      // Sentinel was just popped. Re-push so the next Back press
      // also triggers us — this keeps the trap arming even if the
      // dialog is dismissed.
      window.history.pushState({ __backInterceptor: true }, "");
      onBackRef.current();
    };

    window.addEventListener("popstate", handler);
    return () => {
      armed = false;
      window.removeEventListener("popstate", handler);
    };
  }, [active]);
}
