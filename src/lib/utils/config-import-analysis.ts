import type { ConfigValues, NumberOption } from "@/lib/schema/types";
import {
  isSafeConfigKey,
  isUnsafeConfigKey,
} from "@/lib/security/config-key-safety";
import { getConfigOption, isPathOption } from "@/lib/utils/config-options";
import {
  createConfigValues,
  normalizeConfigValues,
} from "@/lib/utils/config-normalization";
import { validateConfigValue } from "@/lib/utils/config-validation";

export type ImportInstructionDisposition =
  | "retained"
  | "overridden"
  | "reset"
  | "ignored"
  | "invalid";

export interface ImportInstruction {
  lineNumber: number;
  key: string;
  rawValue: string;
  normalizedValue?: unknown;
  disposition: ImportInstructionDisposition;
  known: boolean;
}

export type ImportDiagnosticCode =
  | "malformed-line"
  | "invalid-boolean"
  | "invalid-number"
  | "unsupported-number-form"
  | "unsupported-number-range"
  | "number-out-of-range"
  | "empty-key"
  | "unknown-option"
  | "unsafe-option-name"
  | "invalid-enum"
  | "invalid-color"
  | "invalid-duration";

export interface ImportDiagnostic {
  code: ImportDiagnosticCode;
  severity: "error" | "warning" | "info";
  lineNumber: number;
  key?: string;
  message: string;
  relatedLineNumbers?: number[];
}

interface UnknownOptionOccurrences {
  retainedInstructionIndex: number;
  overriddenLineNumbers: number[];
}

export interface ImportAnalysis {
  candidateConfig: ConfigValues;
  normalizedConfig: ConfigValues;
  instructions: ImportInstruction[];
  diagnostics: ImportDiagnostic[];
  summary: {
    acceptedInstructionCount: number;
    effectiveInstructionCount: number;
    skippedLineCount: number;
    resultingSettingCount: number;
  };
  hasMeaningfulInstruction: boolean;
}

function stripDoubleQuotes(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  return value;
}

function stripMatchingQuotes(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

type ParsedPathValue =
  | { kind: "reset" }
  | { kind: "ignore" }
  | { kind: "value"; value: string };

function parsePathValue(rawValue: string): ParsedPathValue {
  if (rawValue === "") {
    return { kind: "reset" };
  }

  if (rawValue.startsWith("?")) {
    const path = stripDoubleQuotes(rawValue.slice(1));
    return path.length === 0
      ? { kind: "ignore" }
      : { kind: "value", value: `?${path}` };
  }

  const unquoted = stripDoubleQuotes(rawValue);
  if (unquoted.length === 0) {
    return { kind: "ignore" };
  }

  return {
    kind: "value",
    value: unquoted.startsWith("?") ? `"${unquoted}"` : unquoted,
  };
}

function appendValue(
  config: ConfigValues,
  key: string,
  value: string,
  alwaysArray = true
) {
  const existing = config[key];

  if (Array.isArray(existing)) {
    existing.push(value);
  } else if (existing !== undefined) {
    config[key] = [existing, value];
  } else {
    config[key] = alwaysArray ? [value] : value;
  }
}

const TRUE_BOOLEAN_TOKENS = new Set(["1", "t", "T", "true"]);
const FALSE_BOOLEAN_TOKENS = new Set(["0", "f", "F", "false"]);
const FLOAT_PATTERN = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const INTEGER_PATTERN = /^(?:0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|[0-9]+)$/;

function parseBoolean(value: string): boolean | null {
  if (TRUE_BOOLEAN_TOKENS.has(value)) return true;
  if (FALSE_BOOLEAN_TOKENS.has(value)) return false;
  return null;
}

type NumberParseResult =
  | { status: "valid"; value: number }
  | { status: "invalid" }
  | { status: "unsupported-range" };

function parseInteger(
  value: string,
  signed: boolean,
  bits: 8 | 16 | 32 | 64
): NumberParseResult {
  const zero = BigInt(0);
  const one = BigInt(1);
  let unsignedValue = value;
  let multiplier = one;

  if (value.startsWith("+") || value.startsWith("-")) {
    if (value[0] === "-" && !signed) return { status: "invalid" };
    multiplier = value[0] === "-" ? BigInt(-1) : one;
    unsignedValue = value.slice(1);
  }

  if (!INTEGER_PATTERN.test(unsignedValue)) return { status: "invalid" };

  try {
    const parsed = BigInt(unsignedValue) * multiplier;
    const width = BigInt(bits);
    const typeMin = signed ? -(one << (width - one)) : zero;
    const typeMax = signed
      ? (one << (width - one)) - one
      : (one << width) - one;
    const safeMin = BigInt(Number.MIN_SAFE_INTEGER);
    const safeMax = BigInt(Number.MAX_SAFE_INTEGER);
    if (parsed < typeMin || parsed > typeMax) {
      return { status: "invalid" };
    }
    if (parsed < safeMin || parsed > safeMax) {
      return { status: "unsupported-range" };
    }
    return { status: "valid", value: Number(parsed) };
  } catch {
    return { status: "invalid" };
  }
}

function isValidMouseScrollMultiplier(value: string): boolean {
  const entries = value.split(",");
  if (entries.length === 0 || entries.some((entry) => entry.trim() === "")) {
    return false;
  }

  return entries.every((entry) => {
    const separator = entry.indexOf(":");
    if (separator <= 0) return false;
    const key = entry.slice(0, separator).trim();
    const rawNumber = entry.slice(separator + 1).trim();
    if (key !== "precision" && key !== "discrete") return false;
    if (!FLOAT_PATTERN.test(rawNumber)) return false;
    return Number.isFinite(Number(rawNumber));
  });
}

function parseNumber(option: NumberOption, value: string): NumberParseResult {
  if (option.numberKind === "float") {
    if (!FLOAT_PATTERN.test(value)) return { status: "invalid" };
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return { status: "invalid" };
    if (option.floatBits === 32 && !Number.isFinite(Math.fround(parsed))) {
      return { status: "invalid" };
    }
    // Keep the user's finite decimal value for stable re-export. Ghostty will
    // apply f32 rounding internally for f32-backed options.
    return { status: "valid", value: parsed };
  }

  return parseInteger(
    value,
    option.numberKind === "signed-integer",
    option.integerBits
  );
}

function invalidInstruction(
  lineNumber: number,
  key: string,
  rawValue: string,
  known = true
): ImportInstruction {
  return {
    lineNumber,
    key,
    rawValue,
    disposition: "invalid",
    known,
  };
}

export function analyzeGhosttyConfig(configString: string): ImportAnalysis {
  const candidateConfig = createConfigValues();
  const instructions: ImportInstruction[] = [];
  const diagnostics: ImportDiagnostic[] = [];
  const unknownOptions = new Map<string, UnknownOptionOccurrences>();
  const lines = configString.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      diagnostics.push({
        code: "malformed-line",
        severity: "warning",
        lineNumber,
        message: "Expected key = value syntax.",
      });
      return;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();

    if (key === "") {
      instructions.push(invalidInstruction(lineNumber, key, rawValue, false));
      diagnostics.push({
        code: "empty-key",
        severity: "error",
        lineNumber,
        message: "Enter an option name before =.",
      });
      return;
    }

    const option = getConfigOption(key);
    const parsedPathValue = option && isPathOption(key)
      ? parsePathValue(rawValue)
      : null;

    if (!option && !isSafeConfigKey(key)) {
      instructions.push(invalidInstruction(lineNumber, key, rawValue, false));
      diagnostics.push({
        code: "unsafe-option-name",
        severity: "error",
        lineNumber,
        key,
        message: isUnsafeConfigKey(key)
          ? "This option name is reserved and cannot be imported safely."
          : "Use a lowercase Ghostty option name containing letters, numbers, and single hyphens.",
      });
      return;
    }

    if (!option) {
      const value = stripMatchingQuotes(rawValue);
      candidateConfig[key] = value;

      const previous = unknownOptions.get(key);
      if (previous) {
        const overridden = instructions[previous.retainedInstructionIndex];
        overridden.disposition = "overridden";
        previous.overriddenLineNumbers.push(overridden.lineNumber);
      }

      const retainedInstructionIndex = instructions.length;
      instructions.push({
        lineNumber,
        key,
        rawValue,
        normalizedValue: value,
        disposition: "retained",
        known: false,
      });

      if (previous) {
        previous.retainedInstructionIndex = retainedInstructionIndex;
      } else {
        unknownOptions.set(key, {
          retainedInstructionIndex,
          overriddenLineNumbers: [],
        });
      }

      return;
    }

    if (parsedPathValue?.kind === "ignore") {
      instructions.push({
        lineNumber,
        key,
        rawValue,
        disposition: "ignored",
        known: true,
      });
      return;
    }

    if (rawValue === "" || parsedPathValue?.kind === "reset") {
      delete candidateConfig[key];
      instructions.push({
        lineNumber,
        key,
        rawValue,
        disposition: "reset",
        known: true,
      });
      return;
    }

    const value = parsedPathValue?.kind === "value"
      ? parsedPathValue.value
      : stripMatchingQuotes(rawValue);
    let normalizedValue: unknown = value;
    const rejectValue = (
      code: ImportDiagnosticCode,
      message: string
    ) => {
      instructions.push(invalidInstruction(lineNumber, key, rawValue));
      diagnostics.push({
        code,
        severity: "error",
        lineNumber,
        key,
        message,
      });
    };

    switch (option.type) {
      case "boolean": {
        const parsed = parseBoolean(value);
        if (parsed === null) {
          rejectValue(
            "invalid-boolean",
            "Use 1, 0, t, T, f, F, true, or false."
          );
          return;
        }
        normalizedValue = parsed;
        candidateConfig[key] = parsed;
        break;
      }
      case "number": {
        if (key === "mouse-scroll-multiplier" && value.includes(":")) {
          if (isValidMouseScrollMultiplier(value)) {
            rejectValue(
              "unsupported-number-form",
              "This value is valid in Ghostty, but Spectre cannot yet represent separate precision and discrete multipliers."
            );
          } else {
            rejectValue("invalid-number", "Enter a valid Ghostty number.");
          }
          return;
        }
        const parsed = parseNumber(option, value);
        if (parsed.status === "invalid") {
          rejectValue("invalid-number", "Enter a valid Ghostty number.");
          return;
        }
        if (parsed.status === "unsupported-range") {
          rejectValue(
            "unsupported-number-range",
            "This integer is valid in Ghostty but exceeds JavaScript's safe integer range, so Spectre cannot import it without losing precision."
          );
          return;
        }
        normalizedValue = parsed.value;
        candidateConfig[key] = parsed.value;
        const validation = validateConfigValue(option, parsed.value);
        for (const warning of validation.warnings) {
          diagnostics.push({
            code: "number-out-of-range",
            severity: "warning",
            lineNumber,
            key,
            message: warning,
          });
        }
        break;
      }
      case "enum": {
        if (!option.options.some((entry) => entry.value === value)) {
          rejectValue(
            "invalid-enum",
            `Use one of: ${option.options.map((entry) => entry.value || "(empty)").join(", ")}.`
          );
          return;
        }
        candidateConfig[key] = value;
        break;
      }
      case "color":
      case "duration": {
        const validation = validateConfigValue(option, value);
        if (!validation.valid) {
          rejectValue(
            option.type === "color" ? "invalid-color" : "invalid-duration",
            validation.errors.join(" ")
          );
          return;
        }
        normalizedValue = validation.normalizedValue ?? value;
        candidateConfig[key] = normalizedValue;
        break;
      }
      case "keybind":
      case "palette":
        appendValue(candidateConfig, key, value);
        break;
      case "string":
        if (option.repeatable) {
          appendValue(candidateConfig, key, value, false);
        } else {
          candidateConfig[key] = value;
        }
        break;
      default:
        candidateConfig[key] = value;
    }

    instructions.push({
      lineNumber,
      key,
      rawValue,
      normalizedValue,
      disposition: "retained",
      known: true,
    });
  });

  for (const [key, occurrence] of unknownOptions) {
    diagnostics.push({
      code: "unknown-option",
      severity: "warning",
      lineNumber: instructions[occurrence.retainedInstructionIndex].lineNumber,
      key,
      message: occurrence.overriddenLineNumbers.length > 0
        ? "Spectre does not recognize this option. Its last occurrence will be retained as an unverified string."
        : "Spectre does not recognize this option. It will be retained as an unverified string.",
      relatedLineNumbers: occurrence.overriddenLineNumbers,
    });
  }
  diagnostics.sort((a, b) => a.lineNumber - b.lineNumber);

  const acceptedInstructionCount = instructions.filter(
    (instruction) =>
      instruction.disposition === "retained" ||
      instruction.disposition === "overridden" ||
      instruction.disposition === "reset"
  ).length;
  // Known scalar override classification is added by the duplicate/order slice (#69).
  const effectiveInstructionCount = instructions.filter(
    (instruction) =>
      instruction.disposition === "retained" ||
      instruction.disposition === "reset"
  ).length;
  const instructionLineNumbers = new Set(
    instructions.map((instruction) => instruction.lineNumber)
  );
  const skippedLineNumbers = new Set(
    instructions
      .filter(
        (instruction) =>
          instruction.disposition === "ignored" ||
          instruction.disposition === "invalid"
      )
      .map((instruction) => instruction.lineNumber)
  );
  for (const diagnostic of diagnostics) {
    if (!instructionLineNumbers.has(diagnostic.lineNumber)) {
      skippedLineNumbers.add(diagnostic.lineNumber);
    }
  }
  const skippedLineCount = skippedLineNumbers.size;
  const normalizedConfig = normalizeConfigValues(candidateConfig);

  return {
    candidateConfig,
    normalizedConfig,
    instructions,
    diagnostics,
    summary: {
      acceptedInstructionCount,
      effectiveInstructionCount,
      skippedLineCount,
      resultingSettingCount: Object.keys(normalizedConfig).length,
    },
    hasMeaningfulInstruction: acceptedInstructionCount > 0,
  };
}
