import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import { allOptions } from "@/data/ghostty-options";
import { normalizePaletteEntries } from "@/lib/utils/palette";
import { SPECTRE_VERSION } from "@/lib/version";

export type ConfigValues = Record<string, unknown>;

interface ConfigStore {
  // Current config values (user-modified values only)
  config: ConfigValues;
  
  // Current applied theme name (for export comment)
  appliedTheme: string | null;

  // Actions
  setValue: (key: string, value: unknown) => void;
  resetValue: (key: string) => void;
  resetAll: () => void;
  importConfig: (configString: string) => void;
  loadConfig: (config: ConfigValues, themeName?: string) => void;
  setAppliedTheme: (themeName: string | null) => void;

  // Computed helpers
  getValue: (key: string) => unknown;
  isModified: (key: string) => boolean;
  getDiff: () => ConfigValues;
  exportConfig: () => string;
}

// Get default value for a key
function getDefaultValue(key: string): unknown {
  const option = allOptions.find((opt) => opt.id === key);
  return option?.default;
}

const PATH_OPTIONS = new Set([
  "background-image",
  "bell-audio-path",
  "config-file",
  "custom-shader",
  "gtk-custom-css",
]);

function isPathOption(key: string): boolean {
  return PATH_OPTIONS.has(key);
}

function isRepeatableOption(key: string): boolean {
  const option = allOptions.find((opt) => opt.id === key);
  if (!option) return false;
  return (
    option.type === "keybind" ||
    option.type === "palette" ||
    ("repeatable" in option && option.repeatable === true)
  );
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

function normalizeValue(key: string, value: unknown): unknown {
  if (key === "palette" && Array.isArray(value)) {
    return normalizePaletteEntries(value as string[]);
  }

  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  return a === b;
}

function shouldStoreValue(key: string, value: unknown): boolean {
  const defaultValue = getDefaultValue(key);

  // Unknown options do not have Spectre defaults; preserve them as raw strings.
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

function normalizeConfigValues(config: ConfigValues): ConfigValues {
  const normalized: ConfigValues = {};

  for (const [key, value] of Object.entries(config)) {
    const normalizedValue = normalizeValue(key, value);

    if (shouldStoreValue(key, normalizedValue)) {
      normalized[key] = normalizedValue;
    }
  }

  return normalized;
}

// Parse a Ghostty config string into an object
function parseConfig(configString: string): ConfigValues {
  const config: ConfigValues = {};
  const lines = configString.split("\n");

  const appendValue = (key: string, value: string, alwaysArray = true) => {
    const existing = config[key];
    if (Array.isArray(existing)) {
      existing.push(value);
    } else if (existing !== undefined) {
      config[key] = [existing, value];
    } else {
      config[key] = alwaysArray ? [value] : value;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Parse key = value
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();

    // Find the option to determine proper type
    const option = allOptions.find((opt) => opt.id === key);
    const parsedPathValue = option && isPathOption(key) ? parsePathValue(rawValue) : null;

    if (option) {
      if (parsedPathValue?.kind === "ignore") {
        continue;
      }

      // In Ghostty, empty known values reset that key to its default.
      if (rawValue === "" || parsedPathValue?.kind === "reset") {
        delete config[key];
        continue;
      }

      const value = parsedPathValue?.kind === "value" ? parsedPathValue.value : stripMatchingQuotes(rawValue);

      // Convert value to proper type
      switch (option.type) {
        case "boolean":
          config[key] = value === "true";
          break;
        case "number":
          config[key] = parseFloat(value as string) || 0;
          break;
        case "keybind":
        case "palette":
          // These are repeatable, accumulate values
          appendValue(key, value as string);
          break;
        case "string":
          if (option.repeatable) {
            appendValue(key, value as string, false);
          } else {
            config[key] = value;
          }
          break;
        default:
          config[key] = value;
      }
    } else {
      // Unknown option, store as string
      config[key] = stripMatchingQuotes(rawValue);
    }
  }

  return config;
}

// Format a value for export
function formatValue(key: string, value: unknown): string {
  const option = allOptions.find((opt) => opt.id === key);

  if (value === null || value === undefined) return "";

  // Convert "default" back to empty string for Ghostty config
  if (value === "default" && option?.type === "enum") {
    return "";
  }

  if (option?.type === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    if (isPathOption(key) && (value.startsWith("?") || value.startsWith('"?'))) {
      return value;
    }

    if (value.includes(" ")) {
      return `"${value}"`;
    }
  }

  return String(value);
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      config: {},
      appliedTheme: null,

      setValue: (key: string, value: unknown) => {
        const normalizedValue = normalizeValue(key, value);

        set((state) => {
          const newConfig = { ...state.config };

          // If value equals default, remove from config
          if (shouldStoreValue(key, normalizedValue)) {
            newConfig[key] = normalizedValue;
          } else {
            delete newConfig[key];
          }

          return { config: newConfig };
        });
      },

      resetValue: (key: string) => {
        set((state) => {
          const newConfig = { ...state.config };
          delete newConfig[key];
          return { config: newConfig };
        });
      },

      resetAll: () => {
        set({ config: {}, appliedTheme: null });
      },
      
      setAppliedTheme: (themeName: string | null) => {
        set({ appliedTheme: themeName });
      },

      getValue: (key: string) => {
        const { config } = get();
        if (key in config) {
          return config[key];
        }
        return getDefaultValue(key);
      },

      isModified: (key: string) => {
        const { config } = get();
        return key in config;
      },

      getDiff: () => {
        return get().config;
      },

      loadConfig: (newConfig: ConfigValues, themeName?: string) => {
        set({ config: normalizeConfigValues(newConfig), appliedTheme: themeName || null });
      },

      importConfig: (configString: string) => {
        const parsed = parseConfig(configString);
        set({ config: normalizeConfigValues(parsed) });
      },

      exportConfig: () => {
        const { config, appliedTheme } = get();
        const lines: string[] = [
          `# Generated by Spectre v${SPECTRE_VERSION} - Ghostty Config Generator`,
          "# https://github.com/imrajyavardhan12/spectre-ghostty-config",
        ];
        
        if (appliedTheme) {
          lines.push(`# Theme: ${appliedTheme}`);
        }
        
        lines.push("");

        // Group options by category for organized output
        const categories = new Map<string, string[]>();

        for (const [key, value] of Object.entries(config)) {
          const option = allOptions.find((opt) => opt.id === key);
          const category = option?.category || "other";

          if (!categories.has(category)) {
            categories.set(category, []);
          }

          // Handle arrays (keybinds, palette)
          if (Array.isArray(value)) {
            const items = key === "palette" ? normalizePaletteEntries(value as string[]) : value;
            for (const item of items) {
              categories.get(category)!.push(`${key} = ${formatValue(key, item)}`);
            }
          } else {
            categories.get(category)!.push(`${key} = ${formatValue(key, value)}`);
          }
        }

        // Output grouped by category
        for (const [category, configLines] of categories) {
          if (configLines.length > 0) {
            lines.push(`# ${category.charAt(0).toUpperCase() + category.slice(1)}`);
            lines.push(...configLines);
            lines.push("");
          }
        }

        return lines.join("\n");
      },
    }),
    {
      name: "spectre-config",
      partialize: (state) => ({ config: state.config, appliedTheme: state.appliedTheme }),
      skipHydration: true,
    }
  )
);

// Selector hooks for convenience
export const useConfigValue = (key: string) => {
  return useConfigStore((state) => {
    if (key in state.config) {
      return state.config[key];
    }
    return getDefaultValue(key);
  });
};

// Track Zustand persist hydration state
// With skipHydration: true, store starts empty and hydrates after StoreProvider mounts
export const useHasHydrated = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Subscribe to hydration finish event
    const unsubscribe = useConfigStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // If already hydrated when this hook runs, defer state update to avoid lint error
    if (useConfigStore.persist.hasHydrated()) {
      queueMicrotask(() => setHydrated(true));
    }

    return unsubscribe;
  }, []);

  return hydrated;
};

export const useIsModified = (key: string) => {
  const hydrated = useHasHydrated();
  const isInConfig = useConfigStore((state) => key in state.config);
  // Only show modified state after hydration to prevent mismatch
  return hydrated && isInConfig;
};
