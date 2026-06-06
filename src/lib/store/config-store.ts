import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { ConfigValues } from "@/lib/schema/types";
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { getDefaultValue, isRepeatableOption } from "@/lib/utils/config-options";
import { parseGhosttyConfig } from "@/lib/utils/config-import";
import { normalizePaletteEntries } from "@/lib/utils/palette";
import { isThemeConfigKey } from "@/lib/utils/theme-config";

export type { ConfigValues };

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

          return {
            config: newConfig,
            appliedTheme: isThemeConfigKey(key) ? null : state.appliedTheme,
          };
        });
      },

      resetValue: (key: string) => {
        set((state) => {
          const newConfig = { ...state.config };
          delete newConfig[key];
          return {
            config: newConfig,
            appliedTheme: isThemeConfigKey(key) ? null : state.appliedTheme,
          };
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
        const parsed = parseGhosttyConfig(configString);
        set({ config: normalizeConfigValues(parsed), appliedTheme: null });
      },

      exportConfig: () => {
        const { config, appliedTheme } = get();
        return exportGhosttyConfig(config, appliedTheme);
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
