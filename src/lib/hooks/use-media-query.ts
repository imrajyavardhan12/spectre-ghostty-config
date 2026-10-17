"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Docked preview pane and the full labeled header. */
export const WIDE_QUERY = "(min-width: 1280px)";
/** Sidebar and the compact header. Below this the editor uses its mobile layout. */
export const TABLET_QUERY = "(min-width: 768px)";

/** Tracks a media query. Renders as `false` on the server and during hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
