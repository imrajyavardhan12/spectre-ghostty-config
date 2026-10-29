import { describe, expect, it } from "vitest";
import { allOptions } from "@/data/ghostty-options";
import { GHOSTTY_BUILTIN_THEMES_ADDED_IN } from "@/data/ghostty-builtin-themes";
import { validateSharedConfig } from "@/lib/security/validate-shared-config";
import { findSensitiveSettings } from "@/lib/security/sensitive-options";
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { analyzeGhosttyConfig } from "@/lib/utils/config-import-analysis";
import { normalizeConfigValues } from "@/lib/utils/config-normalization";

const byId = (id: string) => allOptions.find((option) => option.id === id);

describe("Ghostty 1.4.0 options", () => {
  it("marks the options the release added", () => {
    for (const id of [
      "scrollback-limit-lines",
      "scrollback-compression",
      "link-osc8",
      "drag-handle",
      "clipboard-write-limit-bytes",
      "middle-click-action",
      "vt-window-resize-allowed",
      "vt-xt-checksum-report",
      "vt-xt-checksum-extension",
      "gtk-tabs-inverted",
      "gtk-horizontal-tab-scroll",
    ]) {
      expect(byId(id)?.sinceVersion, id).toBe("1.4.0");
    }
  });

  it("records the rename rather than a new option for scrollback-limit-bytes", () => {
    const option = byId("scrollback-limit-bytes");
    expect(option?.sinceVersion).toBeUndefined();
    expect(option?.renamed).toEqual({ from: "scrollback-limit", in: "1.4.0" });
    expect(byId("scrollback-limit")).toBeUndefined();
  });

  it("keeps true and false as accepted values of the options that gained new ones", () => {
    for (const id of ["copy-on-select", "window-padding-balance"]) {
      const values = (byId(id) as { options: { value: string }[] }).options.map((choice) => choice.value);
      expect(values, id).toEqual(expect.arrayContaining(["true", "false"]));
    }
  });
});

describe("importing configs written for an older Ghostty", () => {
  it("reads scrollback-limit as scrollback-limit-bytes", () => {
    const analysis = analyzeGhosttyConfig("scrollback-limit = 20000000");
    expect(analysis.candidateConfig).toEqual({ "scrollback-limit-bytes": 20_000_000 });
    expect(analysis.instructions[0]).toMatchObject({ key: "scrollback-limit-bytes", known: true });
  });

  it("lets the later of the old and new key win, as Ghostty does", () => {
    const analysis = analyzeGhosttyConfig("scrollback-limit-bytes = 1\nscrollback-limit = 2");
    expect(analysis.candidateConfig).toEqual({ "scrollback-limit-bytes": 2 });
  });

  it("keeps the true and false of an option that became an enum", () => {
    expect(analyzeGhosttyConfig("copy-on-select = true").candidateConfig).toEqual({ "copy-on-select": "true" });
    expect(analyzeGhosttyConfig("window-padding-balance = false").candidateConfig).toEqual({
      "window-padding-balance": "false",
    });
    expect(analyzeGhosttyConfig("window-padding-balance = equal").candidateConfig).toEqual({
      "window-padding-balance": "equal",
    });
  });

  it("says unlimited is valid in Ghostty but not representable, instead of calling it a bad number", () => {
    for (const key of ["scrollback-limit-bytes", "clipboard-write-limit-bytes"]) {
      const analysis = analyzeGhosttyConfig(`${key} = unlimited`);
      expect(analysis.candidateConfig).toEqual({});
      expect(analysis.diagnostics[0]).toMatchObject({ code: "unsupported-number-form", severity: "error" });
      expect(analysis.diagnostics[0].message).toMatch(/valid in Ghostty/i);
    }
    expect(analyzeGhosttyConfig("scrollback-limit-bytes = nonsense").diagnostics[0].code).toBe("invalid-number");
  });
});

describe("limit values", () => {
  // Each of these was checked against Ghostty's own parser: Zig's parseInt(usize, input, 0), after an exact `unlimited`.
  it.each([
    "unlimited", "5000", "0x10", "0b101", "0o17", "+5", "+0x10", "1_000", "0x1_f", "1__0", "007", "-0",
    "18446744073709551615", "0xffffffffffffffff",
  ])("accepts scrollback-limit-lines = %s", (value) => {
    expect(analyzeGhosttyConfig(`scrollback-limit-lines = ${value}`).candidateConfig).toEqual({
      "scrollback-limit-lines": value,
    });
  });

  it.each([
    "abc", "-3", "1.5", "5k", "Unlimited", "_1", "1_", "0x", "0b2", "++1", "1e3",
    "18446744073709551616", "99999999999999999999999", "0x10000000000000000",
  ])("rejects scrollback-limit-lines = %s instead of exporting it", (value) => {
    const analysis = analyzeGhosttyConfig(`scrollback-limit-lines = ${value}`);
    expect(analysis.candidateConfig).toEqual({});
    expect(analysis.diagnostics[0]).toMatchObject({ code: "invalid-limit", severity: "error" });
  });

  it("rejects whitespace inside quotes, as Ghostty does, since it would be written back as a quoted value", () => {
    expect(analyzeGhosttyConfig('scrollback-limit-lines = "100 "').candidateConfig).toEqual({});
    expect(analyzeGhosttyConfig("scrollback-limit-lines =   100  ").candidateConfig).toEqual({
      "scrollback-limit-lines": "100",
    });
  });

  it("drops an invalid limit from a share link and keeps a valid one", () => {
    expect(validateSharedConfig({ "scrollback-limit-lines": "lots" }).dropped).toEqual([
      { key: "scrollback-limit-lines", reason: "invalid value shape" },
    ]);
    expect(validateSharedConfig({ "scrollback-limit-lines": " 5" }).dropped).toHaveLength(1);
    expect(validateSharedConfig({ "scrollback-limit-lines": "unlimited" }).config).toEqual({
      "scrollback-limit-lines": "unlimited",
    });
  });
});

describe("explicit values that equal a default Ghostty changed", () => {
  it("exports an explicit 50 MB scrollback for a 1.3 target, whose default is 10 MB", () => {
    const store = normalizeConfigValues(analyzeGhosttyConfig("scrollback-limit = 50000000").candidateConfig);
    expect(exportGhosttyConfig(store, null, "1.3.1")).toContain("scrollback-limit = 50000000");
  });

  it("exports every copy-on-select choice, including Primary on macOS where Ghostty's default is None", () => {
    expect(exportGhosttyConfig(normalizeConfigValues({ "copy-on-select": "primary" }), null, "1.4.0")).toContain(
      "copy-on-select = primary"
    );
  });
});

describe("share links made before 1.4.0", () => {
  it("accepts the old scrollback-limit key", () => {
    expect(validateSharedConfig({ "scrollback-limit": 20_000_000 })).toEqual({
      config: { "scrollback-limit-bytes": 20_000_000 },
      dropped: [],
    });
  });

  it("accepts the boolean an option held before it became an enum", () => {
    expect(validateSharedConfig({ "window-padding-balance": true }).config).toEqual({
      "window-padding-balance": "true",
    });
    expect(validateSharedConfig({ "window-padding-balance": "equal" }).config).toEqual({
      "window-padding-balance": "equal",
    });
  });

  it("still drops a value that is neither", () => {
    expect(validateSharedConfig({ "window-padding-balance": 3 }).dropped).toEqual([
      { key: "window-padding-balance", reason: "invalid value shape" },
    ]);
  });
});

describe("exporting for a target", () => {
  it("writes scrollback-limit for a target before the rename, and the new key from it", () => {
    const config = { "scrollback-limit-bytes": 20_000_000 };
    const before = exportGhosttyConfig(config, null, "1.3.1");
    expect(before).toContain("scrollback-limit = 20000000");
    expect(before).not.toContain("scrollback-limit-bytes");
    expect(exportGhosttyConfig(config, null, "1.4.0")).toContain("scrollback-limit-bytes = 20000000");
    expect(exportGhosttyConfig(config)).toContain("scrollback-limit-bytes = 20000000");
  });

  it("names enum values newer than the target in a warning, and writes them anyway", () => {
    const output = exportGhosttyConfig({ "copy-on-select": "both", "window-padding-balance": "equal" }, null, "1.3.1");
    expect(output).toContain(
      "# Warning: 2 values require Ghostty newer than 1.3.1: copy-on-select = both, window-padding-balance = equal."
    );
    expect(output).toContain("copy-on-select = both");
    expect(exportGhosttyConfig({ "copy-on-select": "both" }, null, "1.4.0")).not.toContain("# Warning");
    expect(exportGhosttyConfig({ "copy-on-select": "clipboard" }, null, "1.3.1")).not.toContain("# Warning");
  });

  it("warns about a built-in theme the target doesn't have, in either half of a pair", () => {
    const added = Object.keys(GHOSTTY_BUILTIN_THEMES_ADDED_IN)[0];
    expect(exportGhosttyConfig({ theme: added }, null, "1.3.1")).toContain(
      `# Warning: 1 value requires Ghostty newer than 1.3.1: theme = ${added}.`
    );
    expect(exportGhosttyConfig({ theme: `light:Dracula,dark:${added}` }, null, "1.3.1")).toContain(
      "# Warning: 1 value requires Ghostty newer than 1.3.1"
    );
    expect(exportGhosttyConfig({ theme: added }, null, "1.4.0")).not.toContain("# Warning");
    expect(exportGhosttyConfig({ theme: "Dracula" }, null, "1.3.1")).not.toContain("# Warning");
  });
});

describe("warnings never echo a value with a line break", () => {
  it("leaves a built-in theme with a trailing newline out of the warning, as the file already omits it", () => {
    const added = Object.keys(GHOSTTY_BUILTIN_THEMES_ADDED_IN)[0];
    const output = exportGhosttyConfig({ theme: `${added}\n` }, null, "1.3.1");
    expect(output).toContain("# Warning: omitted 1 option with line breaks in the value: theme.");
    expect(output).not.toContain("require");
    expect(output.split("\n").every((line) => line === "" || line.startsWith("#"))).toBe(true);
  });
});

describe("settings that weaken what a program can do", () => {
  it("flags the 1.4 options that let a program resize the window or read the screen back", () => {
    expect(findSensitiveSettings({ "vt-window-resize-allowed": true, "vt-xt-checksum-report": true })).toEqual([
      { key: "vt-window-resize-allowed", values: ["true"], reason: "weakens-protection" },
      { key: "vt-xt-checksum-report", values: ["true"], reason: "weakens-protection" },
    ]);
    expect(findSensitiveSettings({ "vt-window-resize-allowed": false, "vt-xt-checksum-report": false })).toEqual([]);
  });
});
