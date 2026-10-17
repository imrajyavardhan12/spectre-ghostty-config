"use client";

import { useId } from "react";
import { allOptions } from "@/data/ghostty-options";
import { GHOSTTY_RELEASES, splitOptionsBySupport } from "@/lib/ghostty-versions";
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface VersionFilterControlsProps {
  /** Compact inline layout for the mobile bar; default is the stacked sidebar layout. */
  compact?: boolean;
}

export function VersionFilterControls({ compact = false }: VersionFilterControlsProps) {
  const targetVersion = useConfigStore((state) => state.targetVersion);
  const setTargetVersion = useConfigStore((state) => state.setTargetVersion);
  const hideUnsupported = useConfigStore((state) => state.hideUnsupported);
  const setHideUnsupported = useConfigStore((state) => state.setHideUnsupported);
  const switchId = useId();
  const selectLabelId = useId();

  const newerCount = splitOptionsBySupport(allOptions, targetVersion).unsupported.length;

  const versionSelect = (
    <Select value={targetVersion} onValueChange={setTargetVersion}>
      <SelectTrigger
        aria-label={compact ? "Target Ghostty version" : undefined}
        aria-labelledby={compact ? undefined : selectLabelId}
        className={cn("font-mono text-xs", compact ? "h-8 min-w-[100px] flex-1" : "h-8 w-full")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GHOSTTY_RELEASES.map((release) => (
          <SelectItem key={release} value={release} className="font-mono text-xs">
            {release}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const hideSwitch = (
    <Switch
      id={switchId}
      checked={hideUnsupported}
      onCheckedChange={setHideUnsupported}
      aria-describedby={newerCount > 0 ? `${switchId}-count` : undefined}
      className="shrink-0"
    />
  );

  const newerNote = newerCount > 0 && (
    <span id={`${switchId}-count`} className="text-[11px] text-subtle-foreground">
      ({newerCount} newer)
    </span>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {versionSelect}
        <div className="flex items-center gap-2">
          {hideSwitch}
          <Label htmlFor={switchId} className="text-xs font-normal text-muted-foreground">
            Hide newer options
          </Label>
          {newerNote}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p id={selectLabelId} className="text-xs text-muted-foreground">
          Target Ghostty version
        </p>
        {versionSelect}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          <Label htmlFor={switchId} className="text-[13px] font-normal">
            Hide newer options
          </Label>
          {newerNote}
        </div>
        {hideSwitch}
      </div>
    </div>
  );
}
