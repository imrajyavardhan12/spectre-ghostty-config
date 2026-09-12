import { describe, expect, it } from "vitest";
import {
  GHOSTTY_BASELINE_VERSION,
  GHOSTTY_RELEASES,
  compareGhosttyVersions,
  getOptionIntroducedIn,
  isKnownGhosttyRelease,
  isOptionSupportedIn,
} from "@/lib/ghostty-versions";

describe("ghostty versions", () => {
  it("pins the audited stable release list", () => {
    expect(GHOSTTY_RELEASES).toEqual([
      "1.0.0", "1.0.1",
      "1.1.0", "1.1.1", "1.1.2", "1.1.3",
      "1.2.0", "1.2.1", "1.2.2", "1.2.3",
      "1.3.0", "1.3.1",
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
    expect(isKnownGhosttyRelease("1.4.0")).toBe(false);
    expect(isKnownGhosttyRelease("tip")).toBe(false);
    expect(isKnownGhosttyRelease("")).toBe(false);
  });

  it("resolves introduction from audited metadata with a 1.0 baseline", () => {
    expect(getOptionIntroducedIn("font-size")).toBe("1.0.0");
    expect(getOptionIntroducedIn("link")).toBe("1.0.0");
    expect(getOptionIntroducedIn("progress-style")).toBe("1.3.1");
    expect(getOptionIntroducedIn("scroll-to-bottom")).toBe("1.2.0");
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
