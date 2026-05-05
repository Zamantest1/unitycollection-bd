import { useCallback, useEffect, useState } from "react";

/**
 * Tiny localStorage-backed state hook.
 *
 * Survives SSR (returns `defaultValue` until the effect runs in the
 * browser), syncs across tabs via the `storage` event, and stays
 * resilient to malformed/legacy entries (silently falls back to
 * `defaultValue`).
 */
export function useLocalStoragePref<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  // Hydrate from storage once we're on the client.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore corrupt JSON
    }
  }, [key]);

  // Reflect future changes back to storage.
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function"
            ? (next as (prev: T) => T)(prev)
            : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore quota/private-mode issues
        }
        return resolved;
      });
    },
    [key],
  );

  // Sync between tabs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [value, update] as const;
}
