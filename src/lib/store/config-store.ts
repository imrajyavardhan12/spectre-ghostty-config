import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { ConfigValues } from "@/lib/schema/types";
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { getDefaultValue } from "@/lib/utils/config-options";
import {
  createConfigValues,
  normalizeConfigValues,
} from "@/lib/utils/config-normalization";
import { isThemeConfigKey } from "@/lib/utils/theme-config";
import { GHOSTTY_COMPATIBILITY_VERSION } from "@/lib/compatibility";
import { isKnownGhosttyRelease } from "@/lib/ghostty-versions";
import { useHistoryStore } from "@/lib/store/history-store";

export type { ConfigValues };

interface ConfigStore {
  // Current config values (user-modified values only)
  config: ConfigValues;
  
  // Current applied theme name (for export comment)
  appliedTheme: string | null;

  // Ghostty release the config targets (editor filtering, export/share warnings).
  // A view preference: never modified by config edits, imports, or resets.
  targetVersion: string;

  // Hide options newer than the target version from navigation and search.
  // Same view-preference lifecycle as targetVersion.
  hideUnsupported: boolean;

  // Actions
  setValue: (key: string, value: unknown) => void;
  resetValue: (key: string) => void;
  resetAll: () => void;
  applyImportedCandidate: (config: ConfigValues) => void;
  loadConfig: (config: ConfigValues, themeName?: string) => void;
  setAppliedTheme: (themeName: string | null) => void;
  setTargetVersion: (version: string) => void;
  setHideUnsupported: (hide: boolean) => void;
  /** Replace config without recording (undo/redo internals only). */
  restoreSnapshot: (snapshot: ConfigValues) => void;
  /** Undo the last recorded mutation; no-op with empty history. */
  undo: () => void;
  /** Redo the last undone mutation; no-op with empty redo stack. */
  redo: () => void;

  // Computed helpers
  getValue: (key: string) => unknown;
  isModified: (key: string) => boolean;
  getDiff: () => ConfigValues;
  exportConfig: () => string;
}


export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      config: createConfigValues(),
      appliedTheme: null,
      targetVersion: GHOSTTY_COMPATIBILITY_VERSION,
      hideUnsupported: false,

      setValue: (key: string, value: unknown) => {
        useHistoryStore.getState().record(get().config, key);
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
        // Keyless on purpose: removals stand alone and never coalesce with
        // neighboring value sets, so set-then-reset recovers the set value.
        useHistoryStore.getState().record(get().config);
        set((state) => {
          const newConfig = normalizeConfigValues(state.config);
          delete newConfig[key];
          return {
            config: newConfig,
            appliedTheme: isThemeConfigKey(key) ? null : state.appliedTheme,
          };
        });
      },

      resetAll: () => {
        useHistoryStore.getState().record(get().config);
        set({ config: createConfigValues(), appliedTheme: null });
      },
      
      setAppliedTheme: (themeName: string | null) => {
        set({ appliedTheme: themeName });
      },

      setTargetVersion: (version: string) => {
        if (!isKnownGhosttyRelease(version)) return;
        set({ targetVersion: version });
      },

      setHideUnsupported: (hide: boolean) => {
        set({ hideUnsupported: hide });
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
        useHistoryStore.getState().record(get().config);
        set({ config: normalizeConfigValues(newConfig), appliedTheme: themeName || null });
      },

      applyImportedCandidate: (candidate: ConfigValues) => {
        useHistoryStore.getState().record(get().config);
        set({ config: normalizeConfigValues(candidate), appliedTheme: null });
      },

      restoreSnapshot: (snapshot: ConfigValues) => {
        // Applied-theme metadata is preserved: undo/redo rewind values, and
        // setValue already clears the theme only when a theme key changes.
        set({ config: normalizeConfigValues(snapshot) });
      },

      undo: () => {
        const snapshot = useHistoryStore.getState().undo(get().config);
        if (snapshot) get().restoreSnapshot(snapshot);
      },

      redo: () => {
        const snapshot = useHistoryStore.getState().redo(get().config);
        if (snapshot) get().restoreSnapshot(snapshot);
      },

      exportConfig: () => {
        const { config, appliedTheme, targetVersion } = get();
        return exportGhosttyConfig(config, appliedTheme, targetVersion);
      },
    }),
    {
      name: "spectre-config",
      partialize: (state) => ({ config: state.config, appliedTheme: state.appliedTheme, targetVersion: state.targetVersion, hideUnsupported: state.hideUnsupported }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<
          Pick<ConfigStore, "config" | "appliedTheme" | "targetVersion" | "hideUnsupported">
        >;
        const config = persisted.config &&
          typeof persisted.config === "object" &&
          !Array.isArray(persisted.config)
          ? normalizeConfigValues(persisted.config)
          : createConfigValues();
        const appliedTheme = typeof persisted.appliedTheme === "string"
          ? persisted.appliedTheme
          : null;
        const targetVersion = typeof persisted.targetVersion === "string" &&
          isKnownGhosttyRelease(persisted.targetVersion)
          ? persisted.targetVersion
          : GHOSTTY_COMPATIBILITY_VERSION;
        const hideUnsupported = persisted.hideUnsupported === true;

        return { ...currentState, config, appliedTheme, targetVersion, hideUnsupported };
      },
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
