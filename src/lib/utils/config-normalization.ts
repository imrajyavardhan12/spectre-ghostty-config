import type { ConfigValues } from "@/lib/schema/types";
import { isSafeConfigKey } from "@/lib/security/config-key-safety";
import {
  getConfigOption,
  getDefaultValue,
  isRepeatableOption,
  resolveRenamedKey,
} from "@/lib/utils/config-options";
import { normalizePaletteEntries } from "@/lib/utils/palette";

export function createConfigValues(): ConfigValues {
  return Object.create(null) as ConfigValues;
}

function normalizeValue(key: string, value: unknown): unknown {
  if (key === "palette" && Array.isArray(value)) {
    return normalizePaletteEntries(value as string[]);
  }

  // An option that grew from a boolean into an enum (window-padding-balance in
  // Ghostty 1.4) keeps true and false as choices, but saved state and older
  // share links hold real booleans.
  if (typeof value === "boolean") {
    const option = getConfigOption(key);
    if (option?.type === "enum" && option.options.some((choice) => choice.value === String(value))) {
      return String(value);
    }
  }

  return Array.isArray(value) ? [...value] : value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  return a === b;
}

function shouldStoreValue(key: string, value: unknown): boolean {
  const defaultValue = getDefaultValue(key);

  if (defaultValue === undefined) {
    return true;
  }

  // The default differs between Ghostty releases, so an explicit value equal to it is still a choice.
  if (getConfigOption(key)?.defaultChangedIn) {
    return true;
  }

  if (valuesEqual(value, defaultValue) || (value === "" && defaultValue === "")) {
    return false;
  }

  if (Array.isArray(value) && value.length === 0 && isRepeatableOption(key)) {
    return false;
  }

  return true;
}

export function normalizeConfigValues(config: ConfigValues): ConfigValues {
  const normalized = createConfigValues();

  for (const [rawKey, value] of Object.entries(config)) {
    if (!isSafeConfigKey(rawKey)) continue;

    const key = resolveRenamedKey(rawKey);
    const normalizedValue = normalizeValue(key, value);

    if (shouldStoreValue(key, normalizedValue)) {
      normalized[key] = normalizedValue;
    }
  }

  return normalized;
}

/** True when two normalized configs hold the same keys and values. */
export function configValuesEqual(a: ConfigValues, b: ConfigValues): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;

  return aKeys.every((key) => key in b && valuesEqual(a[key], b[key]));
}
