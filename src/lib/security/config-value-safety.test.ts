import { describe, expect, it } from "vitest";
import {
  containsConfigLineBreak,
  containsUnsafeValueCharacters,
} from "@/lib/security/config-value-safety";

describe("config value safety", () => {
  it("flags line breaks that would split an exported config line", () => {
    for (const value of ["a\nb", "a\rb", ["ok", "a\nb"]]) {
      expect(containsConfigLineBreak(value), JSON.stringify(value)).toBe(true);
    }
  });

  it("accepts single-line values and non-string values", () => {
    for (const value of ["JetBrains Mono", "a\tb", ["ok", "fine"], 14, true, null]) {
      expect(containsConfigLineBreak(value), JSON.stringify(value)).toBe(false);
      expect(containsUnsafeValueCharacters(value), JSON.stringify(value)).toBe(false);
    }
  });

  it("rejects control and line-separator characters from untrusted values", () => {
    for (const value of [
      "a\nb",
      "a\rb",
      "a\x00b",
      "a\x1b[31mb",
      "a\x7fb",
      "a\u0085b",
      "a\u2028b",
      "a\u2029b",
      ["ok", "a\x1bb"],
    ]) {
      expect(containsUnsafeValueCharacters(value), JSON.stringify(value)).toBe(true);
    }
  });
});
