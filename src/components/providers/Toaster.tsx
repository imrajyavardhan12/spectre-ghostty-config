"use client";

import { useEffect, useState } from "react";
import { CircleCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/lib/store/config-store";
import { useToastStore } from "@/lib/store/toast-store";

const TOAST_DURATION_MS = 8000;

/** The toast that offers Undo after a bulk change such as a reset. */
export function Toaster() {
  const toast = useToastStore((state) => state.toast);
  const dismiss = useToastStore((state) => state.dismiss);
  const config = useConfigStore((state) => state.config);
  const undo = useConfigStore((state) => state.undo);
  // Any later edit makes Undo ambiguous (it would undo that edit instead), so the toast steps aside.
  const visible = toast !== null && toast.config === config;
  const id = toast?.id;
  // Someone pointing at or tabbing to Undo needs it to stay put.
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (id === undefined || held) return;
    const timer = setTimeout(dismiss, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [id, held, dismiss]);

  return (
    // Always mounted so screen readers announce the text when it appears. Below the dialog
    // layer on purpose: a full-screen dialog on a phone must not have its buttons covered.
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-[92px] z-40 flex justify-center px-4 md:bottom-7"
    >
      {visible && (
        <div
          key={toast.id}
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
          className="pointer-events-auto flex animate-fade-up items-center gap-2.5 rounded-[10px] border border-border bg-popover py-2 pr-2 pl-3.5 text-[13px] shadow-md"
        >
          {toast.icon === "success" ? (
            <CircleCheck className="size-[15px] shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-[15px] shrink-0 text-primary" aria-hidden="true" />
          )}
          <span className="min-w-0">{toast.text}</span>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2.5"
            onClick={() => {
              undo();
              dismiss();
            }}
          >
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}
