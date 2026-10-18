"use client";

import { ReactNode } from "react";
import { RotateCcw, Info, ExternalLink, ClockArrowUp } from "lucide-react";
import { useConfigStore } from "@/lib/store/config-store";
import { isOptionSupportedIn } from "@/lib/ghostty-versions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GHOSTTY_DOCS_BASE_URL = "https://ghostty.org/docs/config/reference";

const PLATFORM_LABELS: Record<string, string> = {
  macos: "macOS",
  linux: "Linux",
  windows: "Windows",
};

interface SettingWrapperProps {
  id: string;
  name: string;
  description: string;
  isModified: boolean;
  onReset: () => void;
  children: ReactNode;
  note?: string;
  deprecated?: boolean;
  sinceVersion?: string;
  platform?: string[];
}

/**
 * One setting as a row inside its group card. States never rely on color alone:
 * modified adds a word and a reset button, newer-than-target says "Needs x.y".
 */
export function SettingWrapper({
  id,
  name,
  description,
  isModified,
  onReset,
  children,
  note,
  deprecated,
  sinceVersion,
  platform,
}: SettingWrapperProps) {
  const targetVersion = useConfigStore((state) => state.targetVersion);
  const needsNewerGhostty = !isOptionSupportedIn(id, targetVersion);

  return (
    <div className="px-5 py-4">
      <div className="mb-3 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {name}
          </label>
          {isModified && (
            <>
              <Badge>
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                Modified
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="-my-1 size-7"
                      aria-label={`Reset ${name} to default`}
                      onClick={onReset}
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Reset to default</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {deprecated && <Badge variant="destructive">Deprecated</Badge>}
          {needsNewerGhostty && sinceVersion ? (
            <Badge variant="warning">
              <ClockArrowUp aria-hidden="true" />
              Needs {sinceVersion}
            </Badge>
          ) : (
            sinceVersion && (
              <Badge variant="outline" className="font-mono">
                {sinceVersion}+
              </Badge>
            )
          )}
          {platform && platform.length > 0 && (
            <Badge variant="outline">
              {platform.map((p) => PLATFORM_LABELS[p] ?? p).join(", ")}
            </Badge>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-1.5">
          <code className="font-mono text-xs text-subtle-foreground">{id}</code>
          <a
            href={`${GHOSTTY_DOCS_BASE_URL}#${id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${name} in Ghostty docs`}
            title="View in Ghostty docs"
            className="rounded-xs text-subtle-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ExternalLink className="size-3" />
          </a>
        </div>

        <div className="mt-1.5 flex items-start gap-1.5">
          <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
          {note && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Note about ${name}`}
                    className="mt-0.5 shrink-0 rounded-xs text-warning focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{note}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}
