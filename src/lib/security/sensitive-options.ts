import type { ConfigValues } from "@/lib/schema/types";

// Settings a recipient should consciously review before adopting a config
// from someone else. Descriptions follow the Ghostty config reference.
export type SensitiveReason = "runs-program" | "weakens-protection";

export interface SensitiveSetting {
  key: string;
  values: string[];
  reason: SensitiveReason;
}

/** Options that execute programs, inject input, or pull in more config. */
const PROGRAM_OPTIONS = new Set([
  "command",
  "initial-command",
  "input",
  "env",
  "config-file",
]);

/** Option values that turn off a safety prompt or protection. */
const WEAKENING_VALUES: Record<string, (value: unknown) => boolean> = {
  "clipboard-read": (value) => value === "allow",
  "clipboard-write": (value) => value === "allow",
  "clipboard-paste-protection": (value) => value === false,
};

function toDisplayValues(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : [value];
  return entries.map((entry) => String(entry));
}

/** Sensitive settings present in a config, sorted by key. */
export function findSensitiveSettings(config: ConfigValues): SensitiveSetting[] {
  const found: SensitiveSetting[] = [];

  for (const [key, value] of Object.entries(config)) {
    if (PROGRAM_OPTIONS.has(key)) {
      found.push({ key, values: toDisplayValues(value), reason: "runs-program" });
    } else if (WEAKENING_VALUES[key]?.(value)) {
      found.push({ key, values: toDisplayValues(value), reason: "weakens-protection" });
    }
  }

  return found.sort((a, b) => a.key.localeCompare(b.key));
}
