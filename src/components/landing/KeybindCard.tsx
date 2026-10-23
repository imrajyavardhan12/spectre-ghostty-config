import { ArrowRight, Info, TriangleAlert } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { LIFT } from "./FeatureRow";

function Keys() {
  return (
    <span className="flex gap-[3px]">
      <Kbd>ctrl</Kbd>
      <Kbd>shift</Kbd>
      <Kbd>t</Kbd>
    </span>
  );
}

/** A picture of two keybind rows: one that does nothing, one that replaces a Ghostty default. */
export function KeybindCard() {
  return (
    <div aria-hidden="true" className={`overflow-hidden rounded-[10px] border border-border bg-card ${LIFT}`}>
      <div className="flex flex-col gap-1.5 bg-warning-soft px-3.5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Keys />
          <ArrowRight className="size-[13px] text-subtle-foreground" />
          <span className="font-mono text-[13px] text-muted-foreground line-through">new_tab</span>
          <span className="flex-1" />
          <span className="flex items-center gap-[5px] text-xs font-medium text-warning-foreground">
            <TriangleAlert className="size-[13px]" />
            No effect
          </span>
        </div>
        <div className="text-xs text-warning-foreground">Row 2 binds the same trigger. Ghostty keeps the last one.</div>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-border px-3.5 py-3">
        <div className="flex items-center gap-2">
          <Keys />
          <ArrowRight className="size-[13px] text-subtle-foreground" />
          <span className="font-mono text-[13px]">new_window</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-[13px] shrink-0" />
          Replaces the Ghostty default ctrl+shift+t → new_tab (Linux).
        </div>
      </div>
    </div>
  );
}
