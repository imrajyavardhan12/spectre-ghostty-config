import type { ConfigOption } from "@/lib/schema/types";
import { X11_COLOR_NAMES } from "@/lib/utils/x11-colors";

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalizedValue?: unknown;
}

const HEX_COLOR_PATTERN = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const DURATION_UNITS = ["ms", "us", "µs", "ns", "y", "w", "d", "h", "m", "s"] as const;
const DURATION_UNIT_MESSAGE = "Use y, w, d, h, m, s, ms, us, µs, or ns.";

function valid(normalizedValue?: unknown, warnings: string[] = []): ConfigValidationResult {
  return { valid: true, errors: [], warnings, normalizedValue };
}

function invalid(errors: string[], warnings: string[] = []): ConfigValidationResult {
  return { valid: false, errors, warnings };
}

function validateColorValue(value: unknown): ConfigValidationResult {
  if (typeof value !== "string") {
    return invalid(["Enter a color value."]);
  }

  const trimmedValue = value.trim();
  if (trimmedValue === "") {
    return valid("");
  }

  if (HEX_COLOR_PATTERN.test(trimmedValue)) {
    return valid(trimmedValue);
  }

  // Ghostty uses the X11 rgb.txt map, which is case-insensitive and includes
  // names with spaces such as "medium spring green".
  if (X11_COLOR_NAMES.has(trimmedValue.toLowerCase())) {
    return valid(trimmedValue);
  }

  return invalid(["Use #RGB, RGB, #RRGGBB, RRGGBB, or a named X11 color."]);
}

function readUnsignedInteger(input: string, startIndex: number) {
  let index = startIndex;
  while (index < input.length && /[0-9]/.test(input[index])) {
    index += 1;
  }

  if (index === startIndex) {
    return null;
  }

  return {
    value: Number(input.slice(startIndex, index)),
    nextIndex: index,
  };
}

function readDurationUnit(input: string, startIndex: number) {
  const remaining = input.slice(startIndex);
  const unit = DURATION_UNITS.find((candidate) => remaining.startsWith(candidate));

  if (!unit) {
    const unknownUnit = remaining.match(/^\S+/)?.[0] ?? remaining;
    return { unit: null, unknownUnit };
  }

  return {
    unit,
    nextIndex: startIndex + unit.length,
  };
}

function validateDurationValue(value: unknown): ConfigValidationResult {
  if (typeof value !== "string") {
    return invalid(["Enter a duration value."]);
  }

  const input = value.trim();
  if (input === "") {
    return valid("");
  }

  let index = 0;
  let sawPart = false;

  while (index < input.length) {
    while (index < input.length && /\s/.test(input[index])) {
      index += 1;
    }

    if (index >= input.length) break;

    const number = readUnsignedInteger(input, index);
    if (!number) {
      return invalid(["Duration values must use whole numbers followed by units."]);
    }

    index = number.nextIndex;

    if (input[index] === ".") {
      return invalid(["Duration values must use whole numbers followed by units."]);
    }

    while (index < input.length && /\s/.test(input[index])) {
      index += 1;
    }

    if (index >= input.length) {
      if (number.value === 0 && !sawPart) {
        return valid(input);
      }

      return invalid(["A duration without a unit is only valid when it is exactly 0."]);
    }

    const unit = readDurationUnit(input, index);
    if (!unit.unit) {
      return invalid([`Unknown duration unit "${unit.unknownUnit}". ${DURATION_UNIT_MESSAGE}`]);
    }

    index = unit.nextIndex;
    sawPart = true;
  }

  return sawPart ? valid(input) : invalid(["Enter a duration value."]);
}

function validateNumberValue(option: ConfigOption, value: unknown): ConfigValidationResult {
  const numericValue = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return invalid(["Enter a valid number."]);
  }

  const warnings: string[] = [];

  if (option.type === "number") {
    if (option.min !== undefined && numericValue < option.min) {
      warnings.push(`Ghostty will clamp values below ${option.min} up to ${option.min}.`);
    }

    if (option.max !== undefined && numericValue > option.max) {
      warnings.push(`Ghostty will clamp values above ${option.max} down to ${option.max}.`);
    }
  }

  return valid(numericValue, warnings);
}

export function validateConfigValue(option: ConfigOption, value: unknown): ConfigValidationResult {
  switch (option.type) {
    case "color":
      return validateColorValue(value);
    case "duration":
      return validateDurationValue(value);
    case "number":
      return validateNumberValue(option, value);
    default:
      return valid(value);
  }
}

export function hasValidationErrors(result: ConfigValidationResult): boolean {
  return result.errors.length > 0;
}

export function hasValidationWarnings(result: ConfigValidationResult): boolean {
  return result.warnings.length > 0;
}
