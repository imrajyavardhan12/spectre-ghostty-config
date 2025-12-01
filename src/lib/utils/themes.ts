// Theme utilities for fetching and parsing Ghostty themes

const GITHUB_API_BASE = "https://api.github.com/repos/mbadolato/iTerm2-Color-Schemes/contents/ghostty";
const RAW_CONTENT_BASE = "https://raw.githubusercontent.com/mbadolato/iTerm2-Color-Schemes/master/ghostty";

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
      case "palette":
        // Format: palette = 0=#000000 or palette = 0=000000
        const paletteMatch = value.match(/^(\d+)=(.+)$/);
        if (paletteMatch) {
          const index = parseInt(paletteMatch[1], 10);
          let color = paletteMatch[2];
          if (!color.startsWith("#")) {
            color = "#" + color;
          }
          if (index >= 0 && index < 16) {
            colors.palette[index] = color;
          }
        }
        break;
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

  const data = await response.json();
  
  return data
    .filter((item: { type: string }) => item.type === "file")
    .map((item: { name: string; download_url: string }) => ({
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

  const content = await response.text();
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
