import type { ITerminalOptions, ITheme } from "ghostty-web";
import type { ConfigValues } from "@/lib/store/config-store";

const ANSI_COLOR_NAMES = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;

type AnsiColorName = (typeof ANSI_COLOR_NAMES)[number];

function parsePaletteEntry(entry: string): { index: number; color: string } | null {
  const match = entry.match(/^(\d+)=(.+)$/);
  if (!match) return null;
  
  const index = parseInt(match[1], 10);
  let color = match[2].trim();
  
  if (!color.startsWith("#")) {
    color = `#${color}`;
  }
  
  return { index, color };
}

function mapPaletteToTheme(palette: string[]): Partial<ITheme> {
  const theme: Partial<ITheme> = {};
  
  for (const entry of palette) {
    const parsed = parsePaletteEntry(entry);
    if (!parsed) continue;
    
    const { index, color } = parsed;
    
    if (index >= 0 && index < 16) {
      const colorName = ANSI_COLOR_NAMES[index];
      (theme as Record<AnsiColorName, string>)[colorName] = color;
    }
  }
  
  return theme;
}

function mapCursorStyle(style: string): "block" | "underline" | "bar" {
  switch (style) {
    case "block":
    case "block_hollow":
      return "block";
    case "bar":
      return "bar";
    case "underline":
      return "underline";
    default:
      return "block";
  }
}

function mapCursorBlink(blink: unknown): boolean {
  if (typeof blink === "boolean") return blink;
  if (typeof blink === "string") return blink === "true";
  return false;
}

export function mapConfigToTerminalOptions(config: ConfigValues): ITerminalOptions {
  const fontSize = (config["font-size"] as number) || 13;
  const fontFamily = (config["font-family"] as string) || "monospace";
  const cursorStyle = mapCursorStyle((config["cursor-style"] as string) || "block");
  const cursorBlink = mapCursorBlink(config["cursor-style-blink"]);

  return {
    cols: 80,
    rows: 24,
    fontSize,
    fontFamily,
    cursorStyle,
    cursorBlink,
    scrollback: 1000,
    disableStdin: true,
    theme: mapConfigToTheme(config),
  };
}

export function mapConfigToTheme(config: ConfigValues): ITheme {
  const theme: ITheme = {};

  if (config["background"]) {
    theme.background = config["background"] as string;
  }
  if (config["foreground"]) {
    theme.foreground = config["foreground"] as string;
  }
  if (config["cursor-color"]) {
    theme.cursor = config["cursor-color"] as string;
  }
  if (config["cursor-text"]) {
    theme.cursorAccent = config["cursor-text"] as string;
  }
  if (config["selection-background"]) {
    theme.selectionBackground = config["selection-background"] as string;
  }
  if (config["selection-foreground"]) {
    theme.selectionForeground = config["selection-foreground"] as string;
  }

  const palette = config["palette"] as string[] | undefined;
  if (palette && Array.isArray(palette)) {
    const paletteTheme = mapPaletteToTheme(palette);
    Object.assign(theme, paletteTheme);
  }

  return theme;
}

export function getDefaultTheme(): ITheme {
  return {
    background: "#1a1b26",
    foreground: "#c0caf5",
    cursor: "#c0caf5",
    selectionBackground: "#364a82",
    black: "#15161e",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
    blue: "#7aa2f7",
    magenta: "#bb9af7",
    cyan: "#7dcfff",
    white: "#a9b1d6",
    brightBlack: "#414868",
    brightRed: "#f7768e",
    brightGreen: "#9ece6a",
    brightYellow: "#e0af68",
    brightBlue: "#7aa2f7",
    brightMagenta: "#bb9af7",
    brightCyan: "#7dcfff",
    brightWhite: "#c0caf5",
  };
}
