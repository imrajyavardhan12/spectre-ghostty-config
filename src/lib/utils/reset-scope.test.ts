import { describe, expect, it } from "vitest";
import { categoryResetKeys, describeResetEntries } from "@/lib/utils/reset-scope";

const target = { targetVersion: "1.3.1", hideUnsupported: false };

describe("categoryResetKeys", () => {
  it("lists only modified options in the category", () => {
    const keys = categoryResetKeys(
      "fonts",
      { "font-size": 16, "cursor-style": "bar", "font-style": "Heavy" },
      target
    );

    expect(keys.sort()).toEqual(["font-size", "font-style"]);
  });

  it("includes options the editor hides behind another control", () => {
    const keys = categoryResetKeys(
      "macos",
      { "macos-icon-ghost-color": "#ffffff", "macos-icon-screen-color": "#000000" },
      target
    );

    expect(keys.sort()).toEqual(["macos-icon-ghost-color", "macos-icon-screen-color"]);
  });

  it("ignores keys that belong to no known option", () => {
    expect(categoryResetKeys("fonts", { "not-a-real-option": "1" }, target)).toEqual([]);
  });
});

describe("describeResetEntries", () => {
  it("shows plain values as they are", () => {
    expect(describeResetEntries({ "font-size": 16, "cursor-style": "bar" }, ["font-size", "cursor-style"])).toEqual([
      { key: "font-size", value: "16" },
      { key: "cursor-style", value: "bar" },
    ]);
  });

  it("counts list values instead of printing them", () => {
    expect(
      describeResetEntries(
        { palette: ["0=#000000", "1=#111111"], keybind: ["ctrl+t=new_tab"], "font-family": ["A", "B", "C"] },
        ["palette", "keybind", "font-family"]
      )
    ).toEqual([
      { key: "palette", value: "2 colors" },
      { key: "keybind", value: "1 binding" },
      { key: "font-family", value: "3 entries" },
    ]);
  });
});
