import { describe, expect, it } from "vitest";
import { mergePreviewTheme, resolvePreviewThemeName } from "@/lib/ghostty/preview-theme";
import { mapConfigToTheme } from "@/lib/ghostty/config-mapper";

describe("resolvePreviewThemeName", () => {
  it("returns single theme names as-is", () => {
    expect(resolvePreviewThemeName("TokyoNight", true)).toBe("TokyoNight");
    expect(resolvePreviewThemeName("  Rose Pine ", false)).toBe("Rose Pine");
  });

  it("picks the side of a light/dark pair for the current appearance, in either order", () => {
    const pair = "light:Rose Pine Dawn,dark:Rose Pine";
    expect(resolvePreviewThemeName(pair, true)).toBe("Rose Pine");
    expect(resolvePreviewThemeName(pair, false)).toBe("Rose Pine Dawn");
    expect(resolvePreviewThemeName("dark: Catppuccin Mocha , light: Catppuccin Latte", false)).toBe(
      "Catppuccin Latte"
    );
  });

  it("returns null for values the browser can't load", () => {
    for (const value of ["", "   ", undefined, 42, "/Users/me/themes/mine", "~/themes/mine", "C:\\themes\\mine"]) {
      expect(resolvePreviewThemeName(value, true), String(value)).toBeNull();
    }
    expect(resolvePreviewThemeName("light:Rose Pine Dawn", true)).toBeNull();
  });
});

describe("mergePreviewTheme", () => {
  const theme = {
    background: "#1a1b26",
    foreground: "#c0caf5",
    "cursor-color": "#c0caf5",
    palette: ["0=#15161e", "1=#f7768e"],
  };

  it("leaves the config untouched without a theme", () => {
    const config = { "font-size": 14 };
    expect(mergePreviewTheme(config, null)).toBe(config);
  });

  it("lets explicit colors and palette entries override the theme", () => {
    const merged = mergePreviewTheme({ theme: "TokyoNight", background: "#000000", palette: ["1=#ff0000"] }, theme);
    expect(merged.background).toBe("#000000");
    expect(merged.foreground).toBe("#c0caf5");

    const colors = mapConfigToTheme(merged);
    expect(colors.black).toBe("#15161e");
    expect(colors.red).toBe("#ff0000");
  });
});
