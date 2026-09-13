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

  const newerCount = splitOptionsBySupport(allOptions, targetVersion).unsupported.length;

  return (
    <div className={cn(compact ? "flex flex-wrap items-center gap-x-2 gap-y-1" : "space-y-2")}>
      {!compact && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Ghostty version
        </p>
      )}
      <Select value={targetVersion} onValueChange={setTargetVersion}>
        <SelectTrigger
          aria-label="Ghostty target version"
          className={cn(compact ? "h-8 min-w-[100px] flex-1 text-xs" : "h-8 w-full text-xs")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GHOSTTY_RELEASES.map((release) => (
            <SelectItem key={release} value={release} className="text-xs">
              {release}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Switch
          id={switchId}
          checked={hideUnsupported}
          onCheckedChange={setHideUnsupported}
          aria-describedby={newerCount > 0 ? `${switchId}-count` : undefined}
          className="shrink-0"
        />
        <Label htmlFor={switchId} className="text-xs font-normal text-muted-foreground">
          Hide newer options
        </Label>
        {newerCount > 0 && (
          <span id={`${switchId}-count`} className="text-[11px] text-muted-foreground">
            ({newerCount} newer)
          </span>
        )}
      </div>
    </div>
  );
}
