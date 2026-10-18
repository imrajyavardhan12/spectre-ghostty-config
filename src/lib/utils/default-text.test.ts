import { describe, expect, it } from "vitest";
import { getOptionById } from "@/data/ghostty-options";
import { formatDefaultText } from "./default-text";

function defaultTextFor(id: string) {
  const option = getOptionById(id);
  if (!option) throw new Error(`missing option ${id}`);
  return formatDefaultText(option);
}

describe("formatDefaultText", () => {
  it("shows booleans as on/off", () => {
    expect(defaultTextFor("mouse-hide-while-typing")).toBe("off");
    expect(defaultTextFor("cursor-click-to-move")).toBe("on");
  });

  it("shows numbers and enum values as written", () => {
    expect(defaultTextFor("font-size")).toBe("13");
  });

  it("shows an enum default as the label the control shows", () => {
    expect(defaultTextFor("cursor-style")).toBe("Block");
    expect(defaultTextFor("window-subtitle")).toBe("None");
  });

  it("quotes selection-word-chars so its whitespace is visible", () => {
    expect(defaultTextFor("selection-word-chars")).toMatch(/^".*"$/);
  });

  it("returns null for empty defaults, repeatable strings, palettes and keybinds", () => {
    expect(defaultTextFor("title")).toBeNull();
    expect(defaultTextFor("palette")).toBeNull();
    expect(defaultTextFor("keybind")).toBeNull();
  });
});
