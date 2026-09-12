import { describe, expect, it } from "vitest";
import {
  isSafeConfigKey,
  isUnsafeConfigKey,
} from "@/lib/security/config-key-safety";

describe("config key safety", () => {
  it("accepts lowercase Ghostty-style option names", () => {
    for (const key of ["theme", "future-option", "future-option-2"]) {
      expect(isSafeConfigKey(key), key).toBe(true);
    }
  });

  it("rejects names outside the lowercase Ghostty option grammar", () => {
    for (const key of [
      "",
      "Future-option",
      "future_option",
      "future option",
      "future--option",
      "-future-option",
      "future-option-",
    ]) {
      expect(isSafeConfigKey(key), key).toBe(false);
    }
  });

  it("rejects prototype-chain and reserved property names", () => {
    for (const key of [
      "__proto__",
      "constructor",
      "prototype",
      "toString",
      "hasOwnProperty",
    ]) {
      expect(isUnsafeConfigKey(key), key).toBe(true);
      expect(isSafeConfigKey(key), key).toBe(false);
    }
  });
});
