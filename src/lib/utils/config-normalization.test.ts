import { describe, expect, it } from "vitest";
import { normalizeConfigValues } from "@/lib/utils/config-normalization";

describe("normalizeConfigValues", () => {
  it("reads a renamed key as the option's current id", () => {
    expect(normalizeConfigValues({ "scrollback-limit": 20_000_000 })).toEqual({
      "scrollback-limit-bytes": 20_000_000,
    });
  });

  it("keeps a value equal to a default Ghostty changed, since an older release used another one", () => {
    expect(normalizeConfigValues({ "scrollback-limit": 50_000_000 })).toEqual({
      "scrollback-limit-bytes": 50_000_000,
    });
    expect(normalizeConfigValues({ "scrollback-limit-bytes": 50_000_000 })).toEqual({
      "scrollback-limit-bytes": 50_000_000,
    });
  });

  it("still drops a value equal to the default of an option whose default never changed", () => {
    expect(normalizeConfigValues({ "link-osc8": true, "mouse-hide-while-typing": false })).toEqual({});
  });

  it("keeps every explicit copy-on-select choice, because Ghostty's own default depends on the platform", () => {
    for (const choice of ["none", "primary", "clipboard", "both"]) {
      expect(normalizeConfigValues({ "copy-on-select": choice })).toEqual({ "copy-on-select": choice });
    }
    expect(normalizeConfigValues({ "copy-on-select": "" })).toEqual({});
  });

  it("turns the boolean an option held before it became an enum into its string choice", () => {
    expect(normalizeConfigValues({ "window-padding-balance": true })).toEqual({
      "window-padding-balance": "true",
    });
    expect(normalizeConfigValues({ "window-padding-balance": "equal" })).toEqual({
      "window-padding-balance": "equal",
    });
  });

  it("leaves booleans on boolean options, and on keys the schema doesn't know", () => {
    expect(normalizeConfigValues({ "mouse-hide-while-typing": true, "future-option": true })).toEqual({
      "mouse-hide-while-typing": true,
      "future-option": true,
    });
  });
});
