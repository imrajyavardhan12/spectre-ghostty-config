import { create } from "zustand";
import type { ConfigValues } from "@/lib/schema/types";
import { useConfigStore } from "@/lib/store/config-store";

export interface Toast {
  id: number;
  text: string;
  /** The config the toast describes; Undo only applies while it is still current. */
  config: ConfigValues;
}

interface ToastStore {
  toast: Toast | null;
  show: (text: string) => void;
  dismiss: () => void;
}

let nextId = 1;

/** A single transient message that offers to undo the config change it announces. */
export const useToastStore = create<ToastStore>()((set) => ({
  toast: null,
  show: (text) => set({ toast: { id: nextId++, text, config: useConfigStore.getState().config } }),
  dismiss: () => set({ toast: null }),
}));
