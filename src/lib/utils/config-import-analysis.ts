import type { ConfigValues } from "@/lib/schema/types";
import { getConfigOption, isPathOption } from "@/lib/utils/config-options";
import { normalizeConfigValues } from "@/lib/utils/config-normalization";

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

export type ImportDiagnosticCode = "malformed-line";

export interface ImportDiagnostic {
  code: ImportDiagnosticCode;
  severity: "error" | "warning" | "info";
  lineNumber: number;
  key?: string;
  message: string;
  relatedLineNumbers?: number[];
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
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
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

export function analyzeGhosttyConfig(configString: string): ImportAnalysis {
  const candidateConfig: ConfigValues = {};
  const instructions: ImportInstruction[] = [];
  const diagnostics: ImportDiagnostic[] = [];
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
    const option = getConfigOption(key);
    const parsedPathValue = option && isPathOption(key)
      ? parsePathValue(rawValue)
      : null;

    if (!option) {
      const value = stripMatchingQuotes(rawValue);
      candidateConfig[key] = value;
      instructions.push({
        lineNumber,
        key,
        rawValue,
        normalizedValue: value,
        disposition: "retained",
        known: false,
      });
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

    switch (option.type) {
      case "boolean":
        normalizedValue = value === "true";
        candidateConfig[key] = normalizedValue;
        break;
      case "number":
        normalizedValue = parseFloat(value) || 0;
        candidateConfig[key] = normalizedValue;
        break;
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

  const acceptedInstructionCount = instructions.filter(
    (instruction) =>
      instruction.disposition === "retained" ||
      instruction.disposition === "reset"
  ).length;
  const effectiveInstructionCount = acceptedInstructionCount;
  const skippedLineCount =
    diagnostics.length +
    instructions.filter((instruction) => instruction.disposition === "ignored")
      .length;
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
