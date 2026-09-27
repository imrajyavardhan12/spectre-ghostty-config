import type { ConfigValues } from "@/lib/schema/types";

/**
 * The theme name Ghostty would load for a `theme` value, or null when the
 * preview can't resolve one. Handles `light:A,dark:B` pairs (either order,
 * whitespace trimmed) by picking the side for the current appearance.
 * Paths to theme files can't be read from the browser, so they return null.
 */
export function resolvePreviewThemeName(value: unknown, prefersDark: boolean): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let name = trimmed;
  if (/(^|,)\s*(light|dark)\s*:/.test(trimmed)) {
    const sides = new Map<string, string>();
    for (const part of trimmed.split(",")) {
      const match = /^\s*(light|dark)\s*:(.*)$/.exec(part);
      if (match) sides.set(match[1], match[2].trim());
    }
    name = sides.get(prefersDark ? "dark" : "light") ?? "";
  }

  if (!name || name.startsWith("/") || name.startsWith("~") || name.includes("\\")) return null;
  return name;
}

/**
 * Layer a theme's colors under the user's config, as Ghostty does: explicit
 * color options win, and palette entries override the theme per index.
 */
export function mergePreviewTheme(config: ConfigValues, themeConfig: ConfigValues | null): ConfigValues {
  if (!themeConfig) return config;

  const merged: ConfigValues = { ...themeConfig, ...config };
  const themePalette = Array.isArray(themeConfig.palette) ? themeConfig.palette : [];
  const userPalette = Array.isArray(config.palette) ? config.palette : [];
  if (themePalette.length > 0 || userPalette.length > 0) {
    // Later entries win for the same index when the palette is mapped.
    merged.palette = [...themePalette, ...userPalette];
  }
  return merged;
}
