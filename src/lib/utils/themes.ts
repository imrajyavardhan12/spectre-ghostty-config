// Theme utilities for fetching and parsing Ghostty themes

import { parsePaletteEntry } from "@/lib/utils/palette";

const GITHUB_API_BASE = "https://api.github.com/repos/mbadolato/iTerm2-Color-Schemes/contents/ghostty";
const RAW_CONTENT_BASE = "https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty";

/**
 * Hard cap on theme payload size. A real Ghostty theme file is well under
 * 10 KB; 256 KB leaves generous headroom for future expansion while
 * preventing a hostile origin from streaming gigabytes into the browser
 * and forcing the parser to OOM. Fetch is aborted as soon as the cap is
 * exceeded, so the cost is bounded regardless of upstream behaviour.
 */
const MAX_THEME_BYTES = 256 * 1024;

/**
 * Asserts that a fetch response is a textual payload before we hand it
 * to the parser. Without this, a misconfigured proxy or a compromised
 * upstream could send HTML / JSON / binary, and our `key = value` line
 * parser would either silently accept garbled values or error in
 * unhelpful ways.
 */
function ensureTextResponse(
  response: Response,
  expectedPrefix: string,
  context: string
): void {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith(expectedPrefix)) {
    throw new Error(
      `Unexpected content-type "${contentType}" while fetching ${context}`
    );
  }
}

/**
 * Read a fetch response body as text, enforcing a hard byte cap. Throws
 * if the body is larger than `MAX_THEME_BYTES`. We stream the response
 * so we can abort as soon as the cap is exceeded rather than waiting
 * for the full body to download.
 */
async function readBoundedText(
  response: Response,
  context: string
): Promise<string> {
  if (!response.body) {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let received = 0;
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_THEME_BYTES) {
      try { await reader.cancel(); } catch { /* noop */ }
      throw new Error(
        `Theme payload exceeded ${MAX_THEME_BYTES} bytes while fetching ${context}`
      );
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  cursorColor?: string;
  cursorText?: string;
  selectionBackground?: string;
  selectionForeground?: string;
  palette: string[];
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  raw: string;
}

export interface ThemeListItem {
  name: string;
  downloadUrl: string;
}

// Parse a Ghostty theme file content into ThemeColors
export function parseThemeContent(content: string): ThemeColors {
  const lines = content.split("\n");
  const colors: ThemeColors = {
    background: "#000000",
    foreground: "#ffffff",
    palette: Array(16).fill(""),
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    switch (key) {
      case "background":
        colors.background = value;
        break;
      case "foreground":
        colors.foreground = value;
        break;
      case "cursor-color":
        colors.cursorColor = value;
        break;
      case "cursor-text":
        colors.cursorText = value;
        break;
      case "selection-background":
        colors.selectionBackground = value;
        break;
      case "selection-foreground":
        colors.selectionForeground = value;
        break;
      case "palette": {
        const paletteEntry = parsePaletteEntry(value);
        if (paletteEntry && paletteEntry.index >= 0 && paletteEntry.index < 16) {
          colors.palette[paletteEntry.index] = paletteEntry.color;
        }
        break;
      }
    }
  }

  return colors;
}

// Fetch list of available themes from GitHub
export async function fetchThemeList(): Promise<ThemeListItem[]> {
  const response = await fetch(GITHUB_API_BASE, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch theme list: ${response.statusText}`);
  }

  ensureTextResponse(response, "application/json", "theme list");

  // The theme list is small (a few hundred entries) but we still cap it
  // defensively in case a future migration brings the list to a different
  // host with looser limits.
  const data = JSON.parse(await readBoundedText(response, "theme list")) as Array<{
    type: string;
    name: string;
    download_url: string;
  }>;

  return data
    .filter((item) => item.type === "file")
    .map((item) => ({
      name: item.name,
      downloadUrl: item.download_url,
    }));
}

// Fetch a single theme by name
export async function fetchTheme(name: string): Promise<Theme> {
  const encodedName = encodeURIComponent(name);
  const url = `${RAW_CONTENT_BASE}/${encodedName}`;

  const response = await fetch(url, {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch theme "${name}": ${response.statusText}`);
  }

  ensureTextResponse(response, "text/", `theme "${name}"`);

  const content = await readBoundedText(response, `theme "${name}"`);
  const colors = parseThemeContent(content);

  return {
    name,
    colors,
    raw: content,
  };
}

// Fetch multiple themes in parallel
export async function fetchThemes(names: string[]): Promise<Theme[]> {
  const results = await Promise.allSettled(names.map(fetchTheme));
  
  return results
    .filter((result): result is PromiseFulfilledResult<Theme> => 
      result.status === "fulfilled"
    )
    .map((result) => result.value);
}

// Convert theme colors to config store format
export function themeToConfig(theme: Theme): Record<string, unknown> {
  const config: Record<string, unknown> = {
    background: theme.colors.background,
    foreground: theme.colors.foreground,
  };

  if (theme.colors.cursorColor) {
    config["cursor-color"] = theme.colors.cursorColor;
  }
  if (theme.colors.cursorText) {
    config["cursor-text"] = theme.colors.cursorText;
  }
  if (theme.colors.selectionBackground) {
    config["selection-background"] = theme.colors.selectionBackground;
  }
  if (theme.colors.selectionForeground) {
    config["selection-foreground"] = theme.colors.selectionForeground;
  }

  // Add palette colors
  const paletteEntries = theme.colors.palette
    .map((color, index) => (color ? `${index}=${color}` : null))
    .filter(Boolean);
  
  if (paletteEntries.length > 0) {
    config.palette = paletteEntries;
  }

  return config;
}

// Popular/featured themes to show first
export const FEATURED_THEMES = [
  "Dracula",
  "Tokyo Night",
  "Catppuccin Mocha",
  "Nord",
  "Gruvbox Dark",
  "One Dark",
  "Solarized Dark",
  "Rose Pine",
  "Kanagawa",
  "Everforest Dark",
  "GitHub Dark",
  "Monokai Soda",
];

// Categorize themes by type (dark/light)
export function categorizeTheme(theme: Theme): "dark" | "light" {
  const bg = theme.colors.background;
  // Simple luminance check
  const hex = bg.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "light" : "dark";
}
