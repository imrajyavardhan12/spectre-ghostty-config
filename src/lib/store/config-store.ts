import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { ConfigValues } from "@/lib/schema/types";
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { getDefaultValue } from "@/lib/utils/config-options";
import { normalizeConfigValues } from "@/lib/utils/config-normalization";
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
  applyImportedCandidate: (config: ConfigValues) => void;
  loadConfig: (config: ConfigValues, themeName?: string) => void;
  setAppliedTheme: (themeName: string | null) => void;

  // Computed helpers
  getValue: (key: string) => unknown;
  isModified: (key: string) => boolean;
  getDiff: () => ConfigValues;
  exportConfig: () => string;
}


export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      config: {},
      appliedTheme: null,

      setValue: (key: string, value: unknown) => {
        set((state) => {
          const newConfig = normalizeConfigValues({
            ...state.config,
            [key]: value,
          });

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

      applyImportedCandidate: (candidate: ConfigValues) => {
        const cloned = Object.fromEntries(
          Object.entries(candidate).map(([key, value]) => [
            key,
            Array.isArray(value) ? [...value] : value,
          ])
        );
        set({ config: normalizeConfigValues(cloned), appliedTheme: null });
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
