import { useEffect, useRef } from "react";

/**
 * Intercept the browser Back button so we can show a confirmation
 * dialog before the user actually leaves the page.
 *
 * The non-Data-Router version of react-router (which this app uses)
 * has no `useBlocker` hook, so we implement the classic
 * "push a sentinel state, listen for popstate" trick:
 *
 *  1. On mount, push a synthetic history entry on top of the current
 *     one. The user is now visually on the same URL, but the back
 *     stack has an extra step.
 *  2. When they hit Back, popstate fires. We swallow the event and
 *     ask the caller (via `onBack`) what to do. The caller typically
 *     opens a confirmation dialog and decides:
 *       - cancel → call `release()` then `history.back()` to actually
 *         leave (the second back unwinds the sentinel + the real one).
 *       - stay   → re-push the sentinel so the next Back press
 *         triggers us again.
 *  3. On unmount we drop the sentinel if it's still there.
 *
 * This is intentionally minimal — it doesn't try to intercept full
 * navigations triggered by `<Link>` clicks. For those, components
 * navigate explicitly and can show their own dialog before doing so.
 */
export function useBackInterceptor(
  active: boolean,
  onBack: (release: () => void) => void,
) {
  // Whether we currently have a sentinel state on the stack.
  const sentinelOnStack = useRef(false);
  // Whether we're in the middle of a programmatic release — in that
  // case we want popstate to fire but we don't want to reinvoke onBack.
  const releasing = useRef(false);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;

    const pushSentinel = () => {
      // Tag the state so we can recognise it later if needed.
      window.history.pushState({ __backInterceptor: true }, "");
      sentinelOnStack.current = true;
    };

    pushSentinel();

    const handler = (_e: PopStateEvent) => {
      if (releasing.current) {
        releasing.current = false;
        sentinelOnStack.current = false;
        return;
      }
      // We just lost our sentinel because the user pressed Back.
      sentinelOnStack.current = false;
      onBackRef.current(() => {
        // Caller chose to actually go back. Mark the next popstate as
        // the natural one we want to ignore, and do it.
        releasing.current = true;
        window.history.back();
      });
      // Re-arm the trap so a subsequent back press triggers again.
      pushSentinel();
    };

    window.addEventListener("popstate", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      // If we're unmounting cleanly without going back, drop the
      // sentinel so the user's stack stays tidy.
      if (sentinelOnStack.current) {
        releasing.current = true;
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
    };
  }, [active]);
}
