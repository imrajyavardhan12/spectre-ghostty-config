import type { ReactNode } from "react";

interface FloatingActionsProps {
  preview: ReactNode;
  config: ReactNode;
}

/** The floating Preview / Config pill shown while the docked pane is closed or the screen is narrow. */
export function FloatingActions({ preview, config }: FloatingActionsProps) {
  return (
    <div className="fixed right-6 bottom-6 z-40 flex items-center gap-0.5 rounded-xl border border-border bg-popover p-1 shadow-md">
      {preview}
      <span aria-hidden="true" className="h-5 w-px bg-border" />
      {config}
    </div>
  );
}
