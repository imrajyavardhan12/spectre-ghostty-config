// Runtime shape validation for decoded share URLs.
//
// `decodeConfig` in url-share.ts takes an LZString payload, runs JSON.parse
// on it, and returns the result typed as `ShareableConfig`. That trust
// boundary is the main XSS / prototype-pollution / DoS surface for the
// "shared configuration" feature: a crafted URL can hand us an object of
// arbitrary shape, and we later feed it into the Zustand store which
// re-renders every value via the input widgets.
//
// Today the widgets all coerce values to primitives on render (React
// escapes strings, numbers are formatted, switches/selects only accept
// well-defined unions), so a malicious payload does not directly produce
// HTML injection. But that's a property of the consumer, not the data
// format. This module enforces the shape explicitly so a future widget
// refactor can't accidentally widen the trust boundary.

import type { ConfigOption } from "@/lib/schema/types";
import { allOptions } from "@/data/ghostty-options";
import { validateConfigValue } from "@/lib/utils/config-validation";

/** Hard caps applied during validation. Generous enough for any realistic
 *  hand-crafted config, small enough to bound memory and render cost. */
export const SHARED_CONFIG_LIMITS = {
  maxKeys: 500,
  maxStringLength: 8192,
  maxArrayLength: 1024,
  maxThemeNameLength: 256,
} as const;

type ValidatedKey =
  | { kind: "ok"; key: string }
  | { kind: "drop"; key: string; reason: string };

interface ValidationContext {
  knownOptionsById: Map<string, ConfigOption>;
}

/**
 * Validate a raw value for a known config key. Returns the cleaned value,
 * or `null` if the value cannot be coerced into the expected shape and
 * should be dropped from the shared config.
 */
function validateValueForOption(
  option: ConfigOption,
  rawValue: unknown
): unknown | null {
  switch (option.type) {
    case "string":
      return option.repeatable
        ? validateRepeatableStringValue(rawValue)
        : validateStringValue(rawValue);

    case "number":
      return validateValueUsingEditorRules(option, rawValue);

    case "boolean":
      if (typeof rawValue === "boolean") return rawValue;
      if (rawValue === "true") return true;
      if (rawValue === "false") return false;
      return null;

    case "enum":
      if (typeof rawValue !== "string") return null;
      if (!option.options.some((o) => o.value === rawValue)) return null;
      return rawValue;

    case "color":
      return validateValueUsingEditorRules(option, rawValue);

    case "palette":
      return validateStringArray(rawValue, (entry) =>
        validatePaletteEntry(entry)
      );

    case "keybind":
      return validateStringArray(rawValue, (entry) =>
        validateKeybindEntry(entry)
      );

    case "duration":
      return validateValueUsingEditorRules(option, rawValue);

    default:
      // Exhaustiveness check - if a new option type is added without
      // updating this switch, TypeScript will fail to compile.
      return null;
  }
}

function validateStringValue(rawValue: unknown): string | null {
  if (typeof rawValue !== "string") return null;
  if (rawValue.length > SHARED_CONFIG_LIMITS.maxStringLength) return null;
  return rawValue;
}

function validateRepeatableStringValue(rawValue: unknown): string | string[] | null {
  if (typeof rawValue === "string") {
    return validateStringValue(rawValue);
  }

  if (!Array.isArray(rawValue)) return null;
  if (rawValue.length > SHARED_CONFIG_LIMITS.maxArrayLength) return null;

  const cleaned: string[] = [];
  for (const entry of rawValue) {
    const cleanedEntry = validateStringValue(entry);
    if (cleanedEntry === null) return null;
    cleaned.push(cleanedEntry);
  }

  return cleaned;
}

function validateValueUsingEditorRules(
  option: ConfigOption,
  rawValue: unknown
): unknown | null {
  if (typeof rawValue === "string" && rawValue.length > SHARED_CONFIG_LIMITS.maxStringLength) {
    return null;
  }

  const validation = validateConfigValue(option, rawValue);
  if (!validation.valid) return null;

  return validation.normalizedValue ?? rawValue;
}

function validateStringArray(
  rawValue: unknown,
  validateEntry: (entry: string) => boolean
): string[] | null {
  let entries: unknown[];

  if (Array.isArray(rawValue)) {
    entries = rawValue;
  } else if (typeof rawValue === "string") {
    // Allow a single string to be promoted to a one-element array. This
    // matches how `parseGhosttyConfig` accepts a single repeatable value.
    entries = [rawValue];
  } else {
    return null;
  }

  if (entries.length > SHARED_CONFIG_LIMITS.maxArrayLength) return null;

  const cleaned: string[] = [];
  for (const entry of entries) {
    if (typeof entry !== "string") return null;
    if (entry.length > SHARED_CONFIG_LIMITS.maxStringLength) return null;
    if (!validateEntry(entry)) return null;
    cleaned.push(entry);
  }

  return cleaned;
}

function validatePaletteEntry(entry: string): boolean {
  // Ghostty accepts decimal, hex (0x), octal (0o), or binary (0b)
  // indices. The downstream `parsePaletteEntry` already validates this;
  // we just enforce a coarse shape so a garbage share URL doesn't
  // pollute the store before it reaches the editor.
  return /^(0|[1-9][0-9]*|0x[0-9a-f]+|0o[0-7]+|0b[01]+)=.+$/i.test(entry);
}

function validateKeybindEntry(entry: string): boolean {
  // Ghostty also accepts `keybind = clear` to clear all default bindings.
  if (entry === "clear") return true;

  // A keybind is `trigger=action`. Don't try to fully parse the trigger
  // / action grammar here - the editor's own validator will surface
  // problems at the row level, and we don't want to reject legacy or
  // future-compatible forms. We just enforce the basic split.
  const eq = entry.indexOf("=");
  if (eq <= 0 || eq === entry.length - 1) return false;
  return entry.length <= SHARED_CONFIG_LIMITS.maxStringLength;
}

function validateKey(
  key: string,
  ctx: ValidationContext
): ValidatedKey {
  if (typeof key !== "string") {
    return { kind: "drop", key: String(key), reason: "non-string key" };
  }
  if (key.length > 256) {
    return { kind: "drop", key, reason: "key too long" };
  }
  // Reject anything that could touch the prototype chain or be a
  // constructor lookup. Config keys are always kebab-case ASCII.
  if (key === "__proto__" || key === "constructor" || key === "prototype") {
    return { kind: "drop", key, reason: "forbidden key" };
  }
  if (!ctx.knownOptionsById.has(key)) {
    return { kind: "drop", key, reason: "unknown option" };
  }
  return { kind: "ok", key };
}

/**
 * Validate and clean a decoded `ConfigValues`-shaped object.
 *
 * - Unknown keys are dropped (the store is the source of truth for which
 *   options exist; we don't want a share URL to seed keys the editor
 *   doesn't know how to render).
 * - Values that don't match the option's expected shape are dropped.
 * - All drops are recorded in `dropped` so the caller can surface them in
 *   the share-page UI if desired.
 *
 * The cleaned object is a fresh, plain object with no prototype links.
 */
export function validateSharedConfig(
  rawConfig: unknown
): {
  config: Record<string, unknown>;
  dropped: Array<{ key: string; reason: string }>;
} {
  const ctx: ValidationContext = {
    knownOptionsById: new Map(allOptions.map((o) => [o.id, o])),
  };

  if (rawConfig === null || typeof rawConfig !== "object" || Array.isArray(rawConfig)) {
    return { config: {}, dropped: [{ key: "<root>", reason: "config must be an object" }] };
  }

  const entries = Object.entries(rawConfig as Record<string, unknown>);
  if (entries.length > SHARED_CONFIG_LIMITS.maxKeys) {
    return {
      config: {},
      dropped: [{ key: "<root>", reason: `more than ${SHARED_CONFIG_LIMITS.maxKeys} keys` }],
    };
  }

  const config: Record<string, unknown> = Object.create(null);
  const dropped: Array<{ key: string; reason: string }> = [];

  for (const [rawKey, rawValue] of entries) {
    const keyResult = validateKey(rawKey, ctx);
    if (keyResult.kind === "drop") {
      dropped.push({ key: keyResult.key, reason: keyResult.reason });
      continue;
    }

    const option = ctx.knownOptionsById.get(keyResult.key)!;
    const cleaned = validateValueForOption(option, rawValue);
    if (cleaned === null) {
      dropped.push({ key: keyResult.key, reason: "invalid value shape" });
      continue;
    }

    config[keyResult.key] = cleaned;
  }

  return { config, dropped };
}

/**
 * Validate a theme name embedded in a share URL. The theme name is
 * rendered as text in the share page (safe), but it's also passed to the
 * config store and shown in the exported config comment, so we still
 * want to bound its length and reject control characters.
 */
export function validateSharedThemeName(rawTheme: unknown): string | null {
  if (typeof rawTheme !== "string") return null;
  if (rawTheme.length === 0) return null;
  if (rawTheme.length > SHARED_CONFIG_LIMITS.maxThemeNameLength) return null;
  // Disallow control characters and any character that could break out
  // of a quoted config comment. The exported theme comment is on its
  // own line so the risk is low, but the constraint is essentially
  // free.
  if (/[\x00-\x1f\x7f"\\]/.test(rawTheme)) return null;
  return rawTheme;
}
