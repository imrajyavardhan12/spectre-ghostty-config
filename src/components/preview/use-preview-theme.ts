"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ConfigValues } from "@/lib/schema/types";
import { fetchTheme, themeToConfig } from "@/lib/utils/themes";
import { resolvePreviewThemeName } from "@/lib/ghostty/preview-theme";

export type PreviewThemeStatus = "none" | "loading" | "ready" | "unavailable";

export interface PreviewTheme {
  /** Theme colors as config values, to layer under the user's own colors. */
  themeConfig: ConfigValues | null;
  /** The theme name being previewed (the side of a light/dark pair in use). */
  themeName: string | null;
  status: PreviewThemeStatus;
}

// One request per theme name for the page's lifetime; failures can be retried.
const themeConfigCache = new Map<string, Promise<ConfigValues>>();

function loadThemeConfig(name: string): Promise<ConfigValues> {
  let pending = themeConfigCache.get(name);
  if (!pending) {
    pending = fetchTheme(name).then(themeToConfig);
    pending.catch(() => themeConfigCache.delete(name));
    themeConfigCache.set(name, pending);
  }
  return pending;
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToAppearance(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Resolve the `theme` option for the preview only; the exported config is
 * unaffected. Light/dark pairs follow the system appearance, as in Ghostty.
 */
export function usePreviewTheme(themeValue: unknown): PreviewTheme {
  const prefersDark = useSyncExternalStore(
    subscribeToAppearance,
    () => window.matchMedia(DARK_QUERY).matches,
    () => true
  );
  const name = resolvePreviewThemeName(themeValue, prefersDark);
  const [loaded, setLoaded] = useState<{ name: string; config: ConfigValues | null } | null>(null);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    loadThemeConfig(name).then(
      (config) => !cancelled && setLoaded({ name, config }),
      () => !cancelled && setLoaded({ name, config: null })
    );
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!name) {
    const hasValue = typeof themeValue === "string" && themeValue.trim() !== "";
    return { themeConfig: null, themeName: null, status: hasValue ? "unavailable" : "none" };
  }
  if (!loaded || loaded.name !== name) return { themeConfig: null, themeName: name, status: "loading" };
  return loaded.config
    ? { themeConfig: loaded.config, themeName: name, status: "ready" }
    : { themeConfig: null, themeName: name, status: "unavailable" };
}
