import type { ConfigValues } from "@/lib/schema/types";
import { getConfigOption, isPathOption } from "@/lib/utils/config-options";

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

  // Ghostty path parsing treats a leading ? as the optional-file marker before
  // stripping double quotes. Therefore `?"foo"` is optional, while `"?foo"`
  // is a required literal path beginning with ?.
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

function appendValue(config: ConfigValues, key: string, value: string, alwaysArray = true) {
  const existing = config[key];

  if (Array.isArray(existing)) {
    existing.push(value);
  } else if (existing !== undefined) {
    config[key] = [existing, value];
  } else {
    config[key] = alwaysArray ? [value] : value;
  }
}

export function parseGhosttyConfig(configString: string): ConfigValues {
  const config: ConfigValues = {};
  const lines = configString.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments. Ghostty comments are only valid on their
    // own line, so inline # characters are preserved as part of values.
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const option = getConfigOption(key);
    const parsedPathValue = option && isPathOption(key) ? parsePathValue(rawValue) : null;

    if (!option) {
      // Unknown options are preserved as raw string values so users don't lose
      // settings Spectre doesn't know about yet.
      config[key] = stripMatchingQuotes(rawValue);
      continue;
    }

    if (parsedPathValue?.kind === "ignore") {
      continue;
    }

    // In Ghostty, empty known values reset that key to its default.
    if (rawValue === "" || parsedPathValue?.kind === "reset") {
      delete config[key];
      continue;
    }

    const value = parsedPathValue?.kind === "value"
      ? parsedPathValue.value
      : stripMatchingQuotes(rawValue);

    switch (option.type) {
      case "boolean":
        config[key] = value === "true";
        break;
      case "number":
        config[key] = parseFloat(value) || 0;
        break;
      case "keybind":
      case "palette":
        appendValue(config, key, value);
        break;
      case "string":
        if (option.repeatable) {
          appendValue(config, key, value, false);
        } else {
          config[key] = value;
        }
        break;
      default:
        config[key] = value;
    }
  }

  return config;
}
