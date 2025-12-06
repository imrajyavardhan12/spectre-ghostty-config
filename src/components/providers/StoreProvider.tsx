"use client";

import { useEffect } from "react";
import { useConfigStore } from "@/lib/store/config-store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useConfigStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
