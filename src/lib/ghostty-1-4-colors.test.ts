import { describe, expect, it } from "vitest";
import { getOptionById } from "@/data/ghostty-options";
import { mapConfigToTheme } from "@/lib/ghostty/config-mapper";
import { validateSharedConfig } from "@/lib/security/validate-shared-config";
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { analyzeGhosttyConfig } from "@/lib/utils/config-import-analysis";
import { validateConfigValue } from "@/lib/utils/config-validation";

const option = (id: string) => getOptionById(id)!;

describe("the color forms Ghostty 1.4.0 added", () => {
  it("are valid in the editor, and keep what was typed", () => {
    for (const value of ["rgb:ff/00/00", "rgbi:1.0/0/0", "#fff000fff", "#ffff00000000"]) {
      expect(validateConfigValue(option("background"), value)).toMatchObject({ valid: true, normalizedValue: value });
    }
  });

  it("are rejected with a message that names them when they are malformed", () => {
    const result = validateConfigValue(option("background"), "rgbi:2/0/0");
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/rgb:RR\/GG\/BB/);
  });

  it("ignore spaces and tabs around a color but not a no-break space", () => {
    expect(validateConfigValue(option("background"), " \t#fff \t")).toMatchObject({ valid: true, normalizedValue: "#fff" });
    expect(validateConfigValue(option("background"), " #fff").valid).toBe(false);
  });

  it("treat a blank entry in a list like Ghostty: an empty token is skipped, a token of spaces is not", () => {
    const list = option("macos-icon-screen-color");
    expect(validateConfigValue(list, "red,,blue").valid).toBe(true);
    expect(validateConfigValue(list, "red,blue,").valid).toBe(true);
    expect(validateConfigValue(list, "red, ,blue").valid).toBe(false);
    expect(validateConfigValue(list, " , ").valid).toBe(false);
  });

  it("work in a list of colors", () => {
    expect(validateConfigValue(option("macos-icon-screen-color"), "rgb:f/f/f, red,rgbi:1/0/0").valid).toBe(true);
    expect(validateConfigValue(option("macos-icon-screen-color"), "rgb:f/f, red").valid).toBe(false);
  });

  it("are imported for color options and palette entries, and a bad one is rejected", () => {
    const ok = analyzeGhosttyConfig("background = rgb:ff/00/00\npalette = 1=rgbi:1/0/0\npalette = 2=#fff000fff");
    expect(ok.candidateConfig).toEqual({
      background: "rgb:ff/00/00",
      palette: ["1=rgbi:1/0/0", "2=#fff000fff"],
    });
    expect(ok.diagnostics).toEqual([]);

    const bad = analyzeGhosttyConfig("background = rgbi:2/0/0\npalette = 1=rgb:f/f");
    expect(bad.candidateConfig).toEqual({});
    expect(bad.diagnostics.map((d) => d.code)).toEqual(["invalid-color", "invalid-palette-color"]);
  });

  it("survive a share link", () => {
    expect(validateSharedConfig({ background: "rgb:ff/00/00" }).config).toEqual({ background: "rgb:ff/00/00" });
    expect(validateSharedConfig({ background: "rgb:ff/00" }).dropped).toHaveLength(1);
  });

  it("reach the preview as #rrggbb, because the terminal canvas reads CSS colors", () => {
    expect(
      mapConfigToTheme({
        background: "rgb:00/00/ff",
        foreground: "rgbi:1/1/1",
        "cursor-color": "#fff000fff",
        "selection-background": "abc",
        palette: ["1=rgb:ff/00/00", "2=red"],
      })
    ).toMatchObject({
      background: "#0000ff",
      foreground: "#ffffff",
      cursor: "#ff00ff",
      selectionBackground: "#aabbcc",
      red: "#ff0000",
      green: "red",
    });
  });
});

describe("exporting the new color forms for an older target", () => {
  it("names them in a warning, and still writes them", () => {
    const output = exportGhosttyConfig(
      { background: "rgb:ff/00/00", foreground: "#fff", palette: ["1=rgbi:1/0/0", "2=#112233"] },
      null,
      "1.3.1"
    );
    expect(output).toContain(
      "# Warning: 2 values require Ghostty newer than 1.3.1: background = rgb:ff/00/00, palette = 1=rgbi:1/0/0."
    );
    expect(output).toContain("background = rgb:ff/00/00");
  });

  it("covers bold-color, which Spectre keeps as free text but Ghostty reads as a color or `bright`", () => {
    expect(exportGhosttyConfig({ "bold-color": "rgb:ff/00/00" }, null, "1.3.0")).toContain(
      "# Warning: 1 value requires Ghostty newer than 1.3.0: bold-color = rgb:ff/00/00."
    );
    expect(exportGhosttyConfig({ "bold-color": "bright" }, null, "1.3.0")).not.toContain("# Warning");
    expect(exportGhosttyConfig({ "bold-color": "#ff0000" }, null, "1.3.0")).not.toContain("# Warning");
  });

  it("covers a list of colors", () => {
    expect(exportGhosttyConfig({ "macos-icon-screen-color": "red,rgb:f/f/f" }, null, "1.3.1")).toContain(
      "# Warning: 1 value requires Ghostty newer than 1.3.1: macos-icon-screen-color = red,rgb:f/f/f."
    );
  });

  it("says nothing on 1.4, or for forms every release reads", () => {
    expect(exportGhosttyConfig({ background: "rgb:ff/00/00" }, null, "1.4.0")).not.toContain("# Warning");
    expect(exportGhosttyConfig({ background: "#ffffff", foreground: "abc", "cursor-color": "red" }, null, "1.3.1")).not.toContain("# Warning");
  });
});
