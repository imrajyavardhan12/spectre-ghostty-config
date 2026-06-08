import { describe, it, expect } from "vitest";
import {
  validateSharedConfig,
  validateSharedThemeName,
  SHARED_CONFIG_LIMITS,
} from "@/lib/security/validate-shared-config";

describe("validateSharedConfig", () => {
  it("accepts a known string option", () => {
    const result = validateSharedConfig({ "font-family": "JetBrains Mono" });
    expect(result.config).toEqual({ "font-family": "JetBrains Mono" });
    expect(result.dropped).toEqual([]);
  });

  it("accepts a known number option", () => {
    const result = validateSharedConfig({ "font-size": 14 });
    expect(result.config).toEqual({ "font-size": 14 });
  });

  it("coerces a numeric string for a number option", () => {
    const result = validateSharedConfig({ "font-size": "16" });
    expect(result.config).toEqual({ "font-size": 16 });
  });

  it("accepts a known boolean option", () => {
    const result = validateSharedConfig({ "mouse-hide-while-typing": true });
    expect(result.config).toEqual({ "mouse-hide-while-typing": true });
  });

  it("coerces 'true'/'false' strings for boolean options", () => {
    const a = validateSharedConfig({ "mouse-hide-while-typing": "true" });
    const b = validateSharedConfig({ "mouse-hide-while-typing": "false" });
    expect(a.config).toEqual({ "mouse-hide-while-typing": true });
    expect(b.config).toEqual({ "mouse-hide-while-typing": false });
  });

  it("drops enum values that aren't in the allowed list", () => {
    const result = validateSharedConfig({ "cursor-style": "rainbow" });
    expect(result.config).toEqual({});
    expect(result.dropped).toEqual([
      { key: "cursor-style", reason: "invalid value shape" },
    ]);
  });

  it("accepts an enum value from the schema", () => {
    const result = validateSharedConfig({ "cursor-style": "bar" });
    expect(result.config).toEqual({ "cursor-style": "bar" });
  });

  it("accepts a hex color with or without #", () => {
    const a = validateSharedConfig({ background: "#1a1b26" });
    const b = validateSharedConfig({ background: "1a1b26" });
    expect(a.config).toEqual({ background: "#1a1b26" });
    expect(b.config).toEqual({ background: "1a1b26" });
  });

  it("accepts a short hex color", () => {
    const result = validateSharedConfig({ background: "#fff" });
    expect(result.config).toEqual({ background: "#fff" });
  });

  it("rejects a color value that is neither hex nor an X11 name", () => {
    const result = validateSharedConfig({ background: "<script>alert(1)</script>" });
    expect(result.config).toEqual({});
    expect(result.dropped).toEqual([
      { key: "background", reason: "invalid value shape" },
    ]);
  });

  it("accepts a valid palette array of N=COLOR entries", () => {
    const result = validateSharedConfig({
      palette: ["0=#000000", "1=#cc0000", "15=#eeeeec"],
    });
    expect(result.config).toEqual({
      palette: ["0=#000000", "1=#cc0000", "15=#eeeeec"],
    });
  });

  it("accepts a single palette string (promoted to a one-element array)", () => {
    const result = validateSharedConfig({ palette: "0=#000000" });
    expect(result.config).toEqual({ palette: ["0=#000000"] });
  });

  it("rejects a palette entry missing the index prefix", () => {
    const result = validateSharedConfig({ palette: ["#000000"] });
    expect(result.config).toEqual({});
    expect(result.dropped).toEqual([
      { key: "palette", reason: "invalid value shape" },
    ]);
  });

  it("rejects a palette entry with a non-numeric index", () => {
    const result = validateSharedConfig({ palette: ["abc=#000000"] });
    expect(result.config).toEqual({});
  });

  it("accepts a keybind array of trigger=action strings", () => {
    const result = validateSharedConfig({
      keybind: ["ctrl+c=copy_to_clipboard", "ctrl+v=paste_from_clipboard"],
    });
    expect(result.config).toEqual({
      keybind: ["ctrl+c=copy_to_clipboard", "ctrl+v=paste_from_clipboard"],
    });
  });

  it("rejects a keybind entry with no '=' separator", () => {
    const result = validateSharedConfig({ keybind: ["ctrl+c"] });
    expect(result.config).toEqual({});
  });

  it("drops unknown option keys", () => {
    const result = validateSharedConfig({
      "not-a-real-option": "anything",
    });
    expect(result.config).toEqual({});
    expect(result.dropped).toEqual([
      { key: "not-a-real-option", reason: "unknown option" },
    ]);
  });

  it("rejects prototype-pollution key names", () => {
    for (const dangerous of ["__proto__", "constructor", "prototype"]) {
      const result = validateSharedConfig({ [dangerous]: "value" });
      expect(result.config).toEqual({});
      expect(result.dropped.some((d) => d.key === dangerous)).toBe(true);
    }
  });

  it("rejects a non-object root", () => {
    expect(validateSharedConfig(null).config).toEqual({});
    expect(validateSharedConfig(undefined).config).toEqual({});
    expect(validateSharedConfig("a string").config).toEqual({});
    expect(validateSharedConfig(42).config).toEqual({});
    expect(validateSharedConfig([]).config).toEqual({});
  });

  it("rejects a config with more than the key cap", () => {
    const tooBig: Record<string, number> = {};
    for (let i = 0; i < SHARED_CONFIG_LIMITS.maxKeys + 1; i++) {
      tooBig[`k${i}`] = i;
    }
    const result = validateSharedConfig(tooBig);
    expect(result.config).toEqual({});
    expect(result.dropped[0].reason).toContain("more than");
  });

  it("rejects a string value longer than the cap", () => {
    const long = "x".repeat(SHARED_CONFIG_LIMITS.maxStringLength + 1);
    const result = validateSharedConfig({ "font-family": long });
    expect(result.config).toEqual({});
  });

  it("returns a fresh object with no prototype links", () => {
    const result = validateSharedConfig({ "font-family": "JetBrains Mono" });
    // Object.create(null) makes this falsy - which is what we want.
    expect(Object.getPrototypeOf(result.config)).toBeNull();
  });

  it("accepts a valid duration", () => {
    const result = validateSharedConfig({ "resize-overlay-duration": "750ms" });
    expect(result.config).toEqual({ "resize-overlay-duration": "750ms" });
  });

  it("accepts a composite duration", () => {
    const result = validateSharedConfig({
      "resize-overlay-duration": "1h30m",
    });
    expect(result.config).toEqual({ "resize-overlay-duration": "1h30m" });
  });

  it("rejects a duration with no unit", () => {
    const result = validateSharedConfig({
      "resize-overlay-duration": "100",
    });
    expect(result.config).toEqual({});
  });

  it("rejects a duration with a decimal part", () => {
    const result = validateSharedConfig({
      "resize-overlay-duration": "1.5s",
    });
    expect(result.config).toEqual({});
  });

  it("accepts '0' as a duration (a bare zero is valid in Ghostty)", () => {
    const result = validateSharedConfig({ "resize-overlay-duration": "0" });
    expect(result.config).toEqual({ "resize-overlay-duration": "0" });
  });
});

describe("validateSharedThemeName", () => {
  it("accepts a normal theme name", () => {
    expect(validateSharedThemeName("Tokyo Night")).toBe("Tokyo Night");
  });

  it("returns null for non-strings", () => {
    expect(validateSharedThemeName(null)).toBeNull();
    expect(validateSharedThemeName(undefined)).toBeNull();
    expect(validateSharedThemeName(42)).toBeNull();
  });

  it("returns null for the empty string", () => {
    expect(validateSharedThemeName("")).toBeNull();
  });

  it("returns null when the name is too long", () => {
    const tooLong = "x".repeat(SHARED_CONFIG_LIMITS.maxThemeNameLength + 1);
    expect(validateSharedThemeName(tooLong)).toBeNull();
  });

  it("rejects control characters", () => {
    expect(validateSharedThemeName("evil\nname")).toBeNull();
    expect(validateSharedThemeName("evil\rname")).toBeNull();
    expect(validateSharedThemeName("evil\tname")).toBeNull();
  });

  it("rejects characters that could break out of a quoted comment", () => {
    expect(validateSharedThemeName('"quoted"')).toBeNull();
    expect(validateSharedThemeName("with\\back")).toBeNull();
  });
});
