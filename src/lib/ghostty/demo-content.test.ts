import { describe, expect, it } from "vitest";
import { GHOSTTY_BUILTIN_THEMES } from "@/data/ghostty-builtin-themes";
import { WIDE_DEMO_COLS, generateDemoContent } from "./demo-content";

// Escape sequences take no columns; every other character here is one column wide.
function visibleLines(content: string): string[] {
  const text = content.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  return text.split("\r\n");
}

const widest = (content: string) => Math.max(...visibleLines(content).map((line) => [...line].length));

describe("generateDemoContent", () => {
  it("keeps the side-by-side layout from 41 columns up, and when the width is unknown", () => {
    const wide = generateDemoContent("Nord", "macos");

    expect(generateDemoContent("Nord", "macos", 41)).toBe(wide);
    expect(generateDemoContent("Nord", "macos", 120)).toBe(wide);
    // The threshold is the width of the wide layout, so a change to one shows up in the other.
    expect(widest(wide)).toBe(WIDE_DEMO_COLS);
  });

  it.each([28, 30, 33, 37, 40])("fits a %i-column terminal without wrapping", (cols) => {
    const content = generateDemoContent("Nord", "macos", cols);

    expect(widest(content)).toBeLessThanOrEqual(cols);
  });

  it("cuts a long theme name to fit rather than wrapping it, in either layout", () => {
    const longest = GHOSTTY_BUILTIN_THEMES.reduce((a, b) => (b.length > a.length ? b : a));

    for (const cols of [28, 37, 41, 44]) {
      const content = generateDemoContent(longest, "macos", cols);
      expect(widest(content), `${longest} at ${cols} columns`).toBeLessThanOrEqual(cols);
    }
  });

  it("fits any theme name length at any width, with the longest OS label", () => {
    for (let cols = 28; cols <= 44; cols += 1) {
      for (let length = 1; length <= 40; length += 1) {
        const content = generateDemoContent("N".repeat(length), "windows", cols);
        expect(widest(content), `${length}-character theme at ${cols} columns`).toBeLessThanOrEqual(
          Math.max(cols, WIDE_DEMO_COLS)
        );
      }
    }
  });

  it("keeps the same sample in the compact layout", () => {
    const text = visibleLines(generateDemoContent("Nord", "linux", 36)).join("\n");

    expect(text).toContain("Ghostty Terminal Preview");
    expect(text).toContain("OS: Linux");
    expect(text).toContain("Theme: Nord");
    expect(text).toContain("Color Palette");
    expect(text).toContain("Text Styles");
    expect(text).toContain("Sample Terminal Session");
  });

  it("says Custom when no theme is applied, in both layouts", () => {
    expect(visibleLines(generateDemoContent(null, "macos", 36)).join("\n")).toContain("Theme: Custom");
    expect(visibleLines(generateDemoContent(null, "macos", 60)).join("\n")).toContain("Theme: Custom");
  });
});
