import type { ConfigOption } from "@/lib/schema/types";
import { X11_COLOR_NAMES } from "@/lib/utils/x11-colors";

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalizedValue?: unknown;
}

const HEX_COLOR_PATTERN = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const TERMINAL_RELATIVE_COLOR_OPTIONS = new Set([
  "cursor-color",
  "cursor-text",
  "selection-background",
  "selection-foreground",
  "search-background",
  "search-foreground",
  "search-selected-background",
  "search-selected-foreground",
]);
const COLOR_LIST_OPTIONS = new Set(["macos-icon-screen-color"]);
const TERMINAL_RELATIVE_COLORS = new Set([
  "cell-foreground",
  "cell-background",
]);
const DURATION_UNITS = ["ms", "us", "µs", "ns", "y", "w", "d", "h", "m", "s"] as const;
const DURATION_UNIT_MESSAGE = "Use y, w, d, h, m, s, ms, us, µs, or ns.";

function valid(normalizedValue?: unknown, warnings: string[] = []): ConfigValidationResult {
  return { valid: true, errors: [], warnings, normalizedValue };
}

function invalid(errors: string[], warnings: string[] = []): ConfigValidationResult {
  return { valid: false, errors, warnings };
}

function isGhosttyColor(value: string): boolean {
  return (
    HEX_COLOR_PATTERN.test(value) ||
    X11_COLOR_NAMES.has(value.toLowerCase())
  );
}

export function validateGhosttyColor(value: unknown): ConfigValidationResult {
  if (typeof value !== "string") {
    return invalid(["Enter a color value."]);
  }

  const trimmedValue = value.trim();
  if (trimmedValue === "") return valid("");
  if (isGhosttyColor(trimmedValue)) return valid(trimmedValue);
  return invalid([
    "Use #RGB, RGB, #RRGGBB, RRGGBB, or a named X11 color.",
  ]);
}

function validateColorValue(
  option: ConfigOption,
  value: unknown
): ConfigValidationResult {
  if (typeof value !== "string") {
    return invalid(["Enter a color value."]);
  }

  const trimmedValue = value.trim();
  if (trimmedValue === "") {
    return valid("");
  }

  if (COLOR_LIST_OPTIONS.has(option.id)) {
    const colors = trimmedValue
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);
    if (
      colors.length > 0 &&
      colors.length <= 64 &&
      colors.every(isGhosttyColor)
    ) {
      return valid(trimmedValue);
    }
    return invalid([
      "Use up to 64 comma-separated #RGB, RGB, #RRGGBB, RRGGBB, or named X11 colors.",
    ]);
  }

  const colorValidation = validateGhosttyColor(trimmedValue);
  if (colorValidation.valid) return colorValidation;

  if (
    TERMINAL_RELATIVE_COLOR_OPTIONS.has(option.id) &&
    TERMINAL_RELATIVE_COLORS.has(trimmedValue)
  ) {
    return valid(trimmedValue);
  }

  return TERMINAL_RELATIVE_COLOR_OPTIONS.has(option.id)
    ? invalid([
        "Use #RGB, RGB, #RRGGBB, RRGGBB, a named X11 color, cell-foreground, or cell-background.",
      ])
    : colorValidation;
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

// Options typed as Ghostty's `Limit`: the exact word `unlimited`, or what Zig's
// `parseInt(usize, input, 0)` accepts: an optional sign (a minus only on zero), a decimal, 0x, 0o
// or 0b number with underscores between digits, and no surrounding whitespace.
const LIMIT_STRING_OPTIONS = new Set(["scrollback-limit-lines"]);
const LIMIT_PATTERN =
  /^[+-]?(?:0[xX][0-9a-fA-F]+(?:_+[0-9a-fA-F]+)*|0[oO][0-7]+(?:_+[0-7]+)*|0[bB][01]+(?:_+[01]+)*|[0-9]+(?:_+[0-9]+)*)$/;
const USIZE_MAX = (BigInt(1) << BigInt(64)) - BigInt(1);

/** Whether Ghostty's Limit parser takes this text; an empty value just means unset. */
export function isValidLimitText(text: string): boolean {
  if (text === "" || text === "unlimited") return true;
  if (!LIMIT_PATTERN.test(text)) return false;
  const negative = text.startsWith("-");
  const digits = text.replace(/^[+-]/, "").replaceAll("_", "");
  // BigInt reads a prefixed number and a decimal with leading zeros the way Zig does.
  const value = BigInt(digits);
  return negative ? value === BigInt(0) : value <= USIZE_MAX;
}

function validateLimitValue(value: unknown): ConfigValidationResult {
  if (typeof value !== "string") return invalid(["Enter a whole number or unlimited."]);
  return isValidLimitText(value) ? valid(value) : invalid(["Use a whole number or unlimited."]);
}

export function validateConfigValue(option: ConfigOption, value: unknown): ConfigValidationResult {
  switch (option.type) {
    case "string":
      return LIMIT_STRING_OPTIONS.has(option.id) ? validateLimitValue(value) : valid(value);
    case "color":
      return validateColorValue(option, value);
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
