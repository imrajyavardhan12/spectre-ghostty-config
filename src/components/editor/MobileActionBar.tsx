"use client";

import { Download, FileText, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/lib/store/config-store";
import { downloadConfigFile } from "@/lib/utils/download-config";
import type { PreviewPaneTab } from "@/components/editor/PreviewPane";

interface MobileActionBarProps {
  onOpen: (tab: PreviewPaneTab) => void;
}

const SECONDARY = "h-11 min-w-0 flex-1 gap-1.5 rounded-[10px] border-border-strong bg-card px-2 text-sm";

/** Phone-only bar under the settings: Preview and Config open the sheet, Export saves the file. */
export function MobileActionBar({ onOpen }: MobileActionBarProps) {
  const modifiedCount = useConfigStore((state) => Object.keys(state.config).length);
  const exportConfig = useConfigStore((state) => state.exportConfig);

  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Button variant="outline" className={SECONDARY} aria-haspopup="dialog" onClick={() => onOpen("preview")}>
        <Monitor className="size-4" aria-hidden="true" />
        Preview
      </Button>
      <Button variant="outline" className={SECONDARY} aria-haspopup="dialog" onClick={() => onOpen("config")}>
        <FileText className="size-4" aria-hidden="true" />
        Config
      </Button>
      <Button
        className="h-11 min-w-0 flex-[1.2] gap-1.5 rounded-[10px] px-2 text-sm"
        disabled={modifiedCount === 0}
        onClick={() => downloadConfigFile(exportConfig())}
      >
        <Download className="size-4" aria-hidden="true" />
        Export · {modifiedCount}
      </Button>
    </div>
  );
}
