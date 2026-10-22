import { allOptions } from "@/data/ghostty-options";
import { isOptionSupportedIn } from "@/lib/ghostty-versions";
import type { Category, ConfigValues } from "@/lib/schema/types";

export interface ResetEntry {
  key: string;
  value: string;
}

/**
 * The modified options a category reset removes. Includes options the editor
 * hides behind another control (the macOS icon colors), and leaves out ones
 * hidden for being newer than the target, so the count matches the header.
 */
export function categoryResetKeys(
  category: Category,
  config: ConfigValues,
  { targetVersion, hideUnsupported }: { targetVersion: string; hideUnsupported: boolean }
): string[] {
  return allOptions
    .filter(
      (option) =>
        option.category === category &&
        option.id in config &&
        (!hideUnsupported || isOptionSupportedIn(option.id, targetVersion))
    )
    .map((option) => option.id);
}

const ARRAY_NOUNS: Record<string, [string, string]> = {
  palette: ["color", "colors"],
  keybind: ["binding", "bindings"],
};

/** What a reset confirmation shows beside each key: the value, or a count for lists. */
export function describeResetEntries(config: ConfigValues, keys: readonly string[]): ResetEntry[] {
  return keys.map((key) => {
    const value = config[key];
    if (Array.isArray(value)) {
      const [one, many] = ARRAY_NOUNS[key] ?? ["entry", "entries"];
      return { key, value: `${value.length} ${value.length === 1 ? one : many}` };
    }
    return { key, value: typeof value === "object" && value !== null ? JSON.stringify(value) : String(value) };
  });
}
