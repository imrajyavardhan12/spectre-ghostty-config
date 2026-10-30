import { describe, expect, it } from "vitest";
import {
  colorNeedsGhostty14,
  ghosttyColorToHex,
  toCssColor,
  isGhosttyColorText,
  parseGhosttyColor,
  trimGhosttyColorText,
} from "@/lib/utils/ghostty-color";

// Every accept, reject and conversion below was checked against Ghostty itself: the grammar over 167,600
// strings with `ghostty +validate-config`, and the converted values with `ghostty +show-config`.

describe("parseGhosttyColor", () => {
  it.each([
    "#fff", "#ffffff", "#fff000fff", "#ffff00000000", "fff", "abcdef", "ABCDEF",
    "rgb:f/f/f", "rgb:ff/00/00", "rgb:ffff/0000/8000", "rgb:1/22/333",
    "rgbi:1/0/0", "rgbi:1.0/0/0.5", "rgbi:.5/1./0", "rgbi:+0.5/-0/00.00", "rgbi:0.999999999999999999999/0/0",
    "red", "Medium Spring Green", "  #fff\t",
  ])("accepts %j", (value) => {
    expect(isGhosttyColorText(value)).toBe(true);
  });

  it.each([
    "", "#", "##fff", "# fff", "#ff", "#ffff", "#fffff", "#fffffff", "#ggg", "#+ff",
    "ff", "ffff", "fffff", "ggg", "0xfff",
    "rgb:f/f", "rgb:f/f/f/f", "rgb:/f/f", "rgb:f//f", "rgb:fffff/0/0", "rgb:+f/0/0", "rgb:f_f/0/0", "rgb:f/f/ f", "RGB:f/f/f", "rgb f/f/f",
    "rgbi:2/0/0", "rgbi:-0.5/0/0", "rgbi:1.0000001/0/0", "rgbi:1e0/0/0", "rgbi:./0/0", "rgbi:+/0/0", "rgbi:0.5.5/0/0", "rgbi:nan/0/0", "rgbi:0x1/0/0",
    "rgbj:f/f/f", "reddish", "gray101", " #fff", "#fff ", "\f#fff", "#fff\v", " red",
  ])("rejects %j", (value) => {
    expect(isGhosttyColorText(value)).toBe(false);
  });

  it("trims spaces and tabs only, as Ghostty does", () => {
    expect(trimGhosttyColorText(" \t #fff \t ")).toBe("#fff");
    expect(trimGhosttyColorText(" #fff")).toBe(" #fff");
  });

  it("names the form, and whether older Ghostty reads it", () => {
    expect(parseGhosttyColor("#abc")).toMatchObject({ kind: "hex", needsGhostty14: false });
    expect(parseGhosttyColor("#aabbcc")).toMatchObject({ kind: "hex", needsGhostty14: false });
    expect(parseGhosttyColor("abcdef")).toMatchObject({ kind: "bare-hex", needsGhostty14: false });
    expect(parseGhosttyColor("red")).toMatchObject({ kind: "name", needsGhostty14: false });
    expect(parseGhosttyColor("#aaabbbccc")).toMatchObject({ kind: "hex", needsGhostty14: true });
    expect(parseGhosttyColor("#aaaabbbbcccc")).toMatchObject({ kind: "hex", needsGhostty14: true });
    expect(parseGhosttyColor("rgb:a/b/c")).toMatchObject({ kind: "rgb", needsGhostty14: true });
    expect(parseGhosttyColor("rgbi:0/0.5/1")).toMatchObject({ kind: "rgbi", needsGhostty14: true });
    expect(colorNeedsGhostty14("rgb:ff/00/00")).toBe(true);
    expect(colorNeedsGhostty14("#ff0000")).toBe(false);
    expect(colorNeedsGhostty14("not a color")).toBe(false);
  });
});

describe("ghosttyColorToHex", () => {
  it.each([
    ["#fff", "#ffffff"],
    ["#1b2", "#11bb22"],
    ["abc", "#aabbcc"],
    ["ABCDEF", "#abcdef"],
    ["#1b2c3d4e5", "#1bc34e"],
    ["#ffffffffffff", "#ffffff"],
    ["rgb:f/f/f", "#ffffff"],
    ["rgb:1/22/333", "#112233"],
    ["rgb:ffff/0000/8000", "#ff007f"],
    ["rgb:fffe/0001/ffff", "#fe00ff"],
    ["rgbi:1/1/1", "#ffffff"],
    ["rgbi:1.0/0/0.5", "#ff007f"],
    ["rgbi:0.5/0.5/0.5", "#7f7f7f"],
    ["rgbi:.5/1./0", "#7fff00"],
    ["rgbi:0.999999/0/0.001", "#fe0000"],
    ["#ffffff  \t ", "#ffffff"],
  ])("%j is %s, the value Ghostty reports", (value, hex) => {
    expect(ghosttyColorToHex(value)).toBe(hex);
  });

  it("has no hex for a name or a value Ghostty rejects", () => {
    expect(ghosttyColorToHex("red")).toBeUndefined();
    expect(ghosttyColorToHex("rgb:f/f")).toBeUndefined();
  });
});

describe("cost", () => {
  it("trims in linear time, even around a long run of spaces inside the text", () => {
    const hostile = `a${" ".repeat(60_000)}b`;
    const started = performance.now();
    expect(trimGhosttyColorText(hostile)).toBe(hostile);
    expect(isGhosttyColorText(hostile)).toBe(false);
    expect(trimGhosttyColorText(" ".repeat(60_000))).toBe("");
    // A regex like /[ \t]+$/ takes seconds on this input; the loop takes well under a tenth of one.
    expect(performance.now() - started).toBeLessThan(250);
  });
});

describe("toCssColor", () => {
  it("is what every painted color goes through", () => {
    expect(toCssColor("rgb:ff/00/00")).toBe("#ff0000");
    expect(toCssColor("ffffff")).toBe("#ffffff");
    expect(toCssColor("red")).toBe("red");
    expect(toCssColor("not a color")).toBe("not a color");
  });
});
