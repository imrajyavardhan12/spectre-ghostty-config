import { create } from "zustand";
import type { ConfigValues } from "@/lib/schema/types";

/** Maximum retained undo steps. Oldest entries drop first. */
export const HISTORY_LIMIT = 50;

/**
 * Window in which consecutive edits to the same option coalesce into one
 * undo step, so typing a value is a single undo instead of one per keystroke.
 */
export const HISTORY_COALESCE_WINDOW_MS = 800;

export interface HistoryEntry {
  /** Config diff snapshot taken before the recorded mutation. */
  snapshot: ConfigValues;
  /** Mutated option key, if the entry covers a single option. */
  key?: string;
  /** Recording time, used only for coalescing. */
  recordedAt: number;
}

function cloneConfigValues(config: ConfigValues): ConfigValues {
  const clone: ConfigValues = {};
  for (const [key, value] of Object.entries(config)) {
    clone[key] = Array.isArray(value) ? [...value] : value;
  }
  return clone;
}

interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];

  /**
   * Record the pre-mutation snapshot. Entries for the same single option
   * within the coalescing window replace the previous entry; everything
   * else pushes, clears redo, and enforces the cap.
   */
  record: (snapshot: ConfigValues, key?: string) => void;
  /** Push the current state to redo and return the snapshot to restore, if any. */
  undo: (current: ConfigValues) => ConfigValues | null;
  /** Push the current state to undo and return the snapshot to restore, if any. */
  redo: (current: ConfigValues) => ConfigValues | null;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  past: [],
  future: [],

  record: (snapshot: ConfigValues, key?: string) => {
    const now = Date.now();
    const { past } = get();
    const last = past[past.length - 1];
    const entry: HistoryEntry = {
      snapshot: cloneConfigValues(snapshot),
      recordedAt: now,
      ...(key !== undefined ? { key } : {}),
    };

    if (
      key !== undefined &&
      last?.key === key &&
      now - last.recordedAt < HISTORY_COALESCE_WINDOW_MS
    ) {
      // Coalesce into the burst's first entry: keep its snapshot (the state
      // before the burst started) so one undo removes the whole burst, and
      // refresh the timestamp so continuous typing stays a single step.
      set({
        past: [...past.slice(0, -1), { ...last, recordedAt: now }],
        future: [],
      });
      return;
    }

    const nextPast = [...past, entry];
    while (nextPast.length > HISTORY_LIMIT) nextPast.shift();
    set({ past: nextPast, future: [] });
  },

  undo: (current: ConfigValues) => {
    const { past, future } = get();
    const entry = past[past.length - 1];
    if (!entry) return null;
    set({
      past: past.slice(0, -1),
      future: [...future, { snapshot: cloneConfigValues(current), recordedAt: Date.now() }],
    });
    return entry.snapshot;
  },

  redo: (current: ConfigValues) => {
    const { past, future } = get();
    const entry = future[future.length - 1];
    if (!entry) return null;
    set({
      past: [...past, { snapshot: cloneConfigValues(current), recordedAt: Date.now() }],
      future: future.slice(0, -1),
    });
    return entry.snapshot;
  },

  clear: () => {
    set({ past: [], future: [] });
  },
}));

/** Selector hooks for header button states. */
export const useCanUndo = () => useHistoryStore((state) => state.past.length > 0);
export const useCanRedo = () => useHistoryStore((state) => state.future.length > 0);
