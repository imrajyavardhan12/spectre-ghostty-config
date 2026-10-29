import { describe, expect, it } from "vitest";
import { fitsSegmentedControl } from "./segmented";

describe("fitsSegmentedControl", () => {
  it("accepts two to four short choices", () => {
    expect(fitsSegmentedControl(["Auto", "None", "Client", "Server"])).toBe(true);
    expect(fitsSegmentedControl(["Yes", "No"])).toBe(true);
  });

  it("rejects a single choice and lists of five or more", () => {
    expect(fitsSegmentedControl(["Only"])).toBe(false);
    expect(fitsSegmentedControl(["a", "b", "c", "d", "e"])).toBe(false);
  });

  it("rejects choices that are too wide in total or alone", () => {
    expect(fitsSegmentedControl(["Block", "Bar", "Underline", "Hollow Block"])).toBe(false);
    expect(fitsSegmentedControl(["Short", "A very long label"])).toBe(false);
  });

  it("allows shorter labels as choices are added, because segments share the width", () => {
    expect(fitsSegmentedControl(["Allow", "Deny", "Ask a person every time"])).toBe(false);
    expect(fitsSegmentedControl(["Off", "Check Only", "Auto"])).toBe(true);
    expect(fitsSegmentedControl(["Off", "Check Only", "Auto Download"])).toBe(false);
    expect(fitsSegmentedControl(["None", "Primary", "Clipboard", "Both"])).toBe(false);
    expect(fitsSegmentedControl(["None", "Primary", "Select", "Both"])).toBe(true);
    expect(fitsSegmentedControl(["Background", "Extend"])).toBe(true);
  });
});
