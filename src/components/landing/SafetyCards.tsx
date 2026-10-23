import { FileCheck2, Link2, RotateCcw, TriangleAlert } from "lucide-react";
import { LIFT_SMALL } from "./FeatureRow";

const CARD = `flex flex-wrap items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-3 text-[13px] ${LIFT_SMALL}`;

/** Pictures of the three safety nets: the undo toast, the import review and a share link that skipped a setting. */
export function SafetyCards() {
  return (
    <div aria-hidden="true" className="flex flex-col items-start gap-2.5">
      <div className={`flex items-center gap-2.5 rounded-[10px] border border-border bg-popover py-2 pr-2 pl-3.5 text-[13px] shadow-md ${LIFT_SMALL}`}>
        <RotateCcw className="size-3.5 text-primary" />
        Reset 8 settings
        <span className="inline-flex h-[26px] items-center rounded-md bg-muted px-2.5 font-medium">Undo</span>
      </div>
      <div className={CARD}>
        <FileCheck2 className="size-3.5 text-muted-foreground" />
        Review import
        <span className="font-mono text-xs text-subtle-foreground">8 settings · 1 skipped line</span>
        <span className="inline-flex h-[26px] items-center rounded-md bg-primary px-2.5 font-medium text-primary-foreground">Replace</span>
      </div>
      <div className={CARD}>
        <Link2 className="size-3.5 text-muted-foreground" />
        <span className="font-mono">/share/rose-pine-comfortable?c=…</span>
        <span className="inline-flex h-[22px] items-center gap-[5px] rounded-[5px] bg-warning-soft px-2 text-xs text-warning-foreground">
          <TriangleAlert className="size-3" />1 setting skipped
        </span>
      </div>
    </div>
  );
}
