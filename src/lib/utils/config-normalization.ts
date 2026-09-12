import type { ConfigValues } from "@/lib/schema/types";
import { isSafeConfigKey } from "@/lib/security/config-key-safety";
import { getDefaultValue, isRepeatableOption } from "@/lib/utils/config-options";
import { normalizePaletteEntries } from "@/lib/utils/palette";

export function createConfigValues(): ConfigValues {
  return Object.create(null) as ConfigValues;
}

function normalizeValue(key: string, value: unknown): unknown {
  if (key === "palette" && Array.isArray(value)) {
    return normalizePaletteEntries(value as string[]);
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

  for (const [key, value] of Object.entries(config)) {
    if (!isSafeConfigKey(key)) continue;

    const normalizedValue = normalizeValue(key, value);

    if (shouldStoreValue(key, normalizedValue)) {
      normalized[key] = normalizedValue;
    }
  }

  return normalized;
}
