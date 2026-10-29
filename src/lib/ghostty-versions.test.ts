import { describe, expect, it } from "vitest";
import type { ConfigOption, EnumOption } from "@/lib/schema/types";
import { allOptions } from "@/data/ghostty-options";
import { GHOSTTY_BUILTIN_THEMES_ADDED_IN } from "@/data/ghostty-builtin-themes";
import {
  GHOSTTY_BASELINE_VERSION,
  GHOSTTY_RELEASES,
  compareGhosttyVersions,
  getChoiceIntroducedIn,
  getOptionIntroducedIn,
  getOptionKeyForTarget,
  getThemeIntroducedIn,
  getVisibleChoices,
  isChoiceSupportedIn,
  isKnownGhosttyRelease,
  isOptionSupportedIn,
  isThemeValueSupportedIn,
  splitOptionsBySupport,
} from "@/lib/ghostty-versions";

describe("ghostty versions", () => {
  it("pins the audited stable release list", () => {
    expect(GHOSTTY_RELEASES).toEqual([
      "1.0.0", "1.0.1",
      "1.1.0", "1.1.1", "1.1.2", "1.1.3",
      "1.2.0", "1.2.1", "1.2.2", "1.2.3",
      "1.3.0", "1.3.1",
      "1.4.0",
    ]);
    expect(GHOSTTY_BASELINE_VERSION).toBe("1.0.0");
  });

  it("compares versions numerically across granularities", () => {
    expect(compareGhosttyVersions("1.3.1", "1.3.1")).toBe(0);
    expect(compareGhosttyVersions("1.2.0", "1.10.0")).toBeLessThan(0);
    expect(compareGhosttyVersions("1.2.3", "1.2.0")).toBeGreaterThan(0);
    expect(compareGhosttyVersions("1.3.0", "1.2.3")).toBeGreaterThan(0);
    expect(compareGhosttyVersions("1.0.1", "1.0.0")).toBeGreaterThan(0);
  });

  it("recognizes only listed releases", () => {
    expect(isKnownGhosttyRelease("1.3.1")).toBe(true);
    expect(isKnownGhosttyRelease("1.0.0")).toBe(true);
    expect(isKnownGhosttyRelease("1.4.0")).toBe(true);
    expect(isKnownGhosttyRelease("1.5.0")).toBe(false);
    expect(isKnownGhosttyRelease("tip")).toBe(false);
    expect(isKnownGhosttyRelease("")).toBe(false);
  });

  it("resolves introduction from audited metadata with a 1.0 baseline", () => {
    expect(getOptionIntroducedIn("font-size")).toBe("1.0.0");
    expect(getOptionIntroducedIn("link")).toBe("1.0.0");
    expect(getOptionIntroducedIn("progress-style")).toBe("1.3.1");
    expect(getOptionIntroducedIn("scroll-to-bottom")).toBe("1.2.0");
  });

  it("partitions option lists preserving order", () => {
    const options = [
      { id: "font-size" },
      { id: "progress-style" },
      { id: "window-titlebar-background" },
    ] as ConfigOption[];
    const { supported, unsupported } = splitOptionsBySupport(options, "1.1.0");
    expect(supported.map((o) => o.id)).toEqual(["font-size", "window-titlebar-background"]);
    expect(unsupported.map((o) => o.id)).toEqual(["progress-style"]);
  });

  it("supports same-or-older options and treats unknown ids as supported", () => {
    expect(isOptionSupportedIn("progress-style", "1.3.1")).toBe(true);
    expect(isOptionSupportedIn("progress-style", "1.3.0")).toBe(false);
    expect(isOptionSupportedIn("font-size", "1.0.0")).toBe(true);
    expect(isOptionSupportedIn("window-titlebar-background", "1.0.0")).toBe(false);
    expect(isOptionSupportedIn("window-titlebar-background", "1.0.1")).toBe(true);
    expect(isOptionSupportedIn("future-option", "1.0.0")).toBe(true);
  });
});

describe("renamed options", () => {
  it("writes the old key for a target before the rename and the new one from it", () => {
    expect(getOptionKeyForTarget("scrollback-limit-bytes", "1.3.1")).toBe("scrollback-limit");
    expect(getOptionKeyForTarget("scrollback-limit-bytes", "1.4.0")).toBe("scrollback-limit-bytes");
    expect(getOptionKeyForTarget("font-size", "1.0.0")).toBe("font-size");
  });
});

describe("enum values by release", () => {
  it("knows which release introduced a value", () => {
    expect(getChoiceIntroducedIn("copy-on-select", "both")).toBe("1.4.0");
    expect(getChoiceIntroducedIn("copy-on-select", "clipboard")).toBeUndefined();
    expect(getChoiceIntroducedIn("font-size", "both")).toBeUndefined();
  });

  it("treats a value newer than the target as unsupported, and everything else as supported", () => {
    expect(isChoiceSupportedIn("window-padding-balance", "equal", "1.3.1")).toBe(false);
    expect(isChoiceSupportedIn("window-padding-balance", "equal", "1.4.0")).toBe(true);
    expect(isChoiceSupportedIn("window-padding-balance", "true", "1.0.0")).toBe(true);
    expect(isChoiceSupportedIn("not-an-option", "x", "1.0.0")).toBe(true);
  });

  const copyOnSelect = allOptions.find((option) => option.id === "copy-on-select") as EnumOption;
  const values = (choices: { value: string }[]) => choices.map((choice) => choice.value);

  it("offers the 1.4 values, without the superseded true and false, on a 1.4 target", () => {
    expect(values(getVisibleChoices(copyOnSelect, "1.4.0", false, ""))).toEqual([
      "", "none", "primary", "clipboard", "both",
    ]);
  });

  it("keeps a superseded value that is currently selected so a saved config never shows blank", () => {
    expect(values(getVisibleChoices(copyOnSelect, "1.4.0", false, "true"))).toContain("true");
  });

  it("labels newer values with their release on an older target, and drops them when hiding", () => {
    const labels = getVisibleChoices(copyOnSelect, "1.3.1", false, "true").map((choice) => choice.label);
    expect(labels).toEqual(["Ghostty default", "None (1.4+)", "Primary (1.4+)", "Clipboard", "Both (1.4+)", "True", "False"]);
    expect(values(getVisibleChoices(copyOnSelect, "1.3.1", true, "true"))).toEqual(["", "clipboard", "true", "false"]);
  });
});

describe("built-in themes by release", () => {
  it("knows which themes the stable target added", () => {
    const [name] = Object.keys(GHOSTTY_BUILTIN_THEMES_ADDED_IN);
    expect(getThemeIntroducedIn(name)).toBe("1.4.0");
    expect(getThemeIntroducedIn("Dracula")).toBeUndefined();
    expect(getThemeIntroducedIn("constructor")).toBeUndefined();
  });

  it("checks both sides of a light/dark pair, and ignores paths and custom names", () => {
    const added = Object.keys(GHOSTTY_BUILTIN_THEMES_ADDED_IN)[0];
    expect(isThemeValueSupportedIn(added, "1.3.1")).toBe(false);
    expect(isThemeValueSupportedIn(added, "1.4.0")).toBe(true);
    expect(isThemeValueSupportedIn(`light:Dracula,dark:${added}`, "1.3.1")).toBe(false);
    expect(isThemeValueSupportedIn("light:Dracula,dark:Nord", "1.3.1")).toBe(true);
    expect(isThemeValueSupportedIn("/home/me/themes/mine", "1.3.1")).toBe(true);
    expect(isThemeValueSupportedIn(undefined, "1.3.1")).toBe(true);
  });
});
