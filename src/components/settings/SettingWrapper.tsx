"use client";

import { ReactNode, useState } from "react";
import { RotateCcw, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const GHOSTTY_DOCS_BASE_URL = "https://ghostty.org/docs/config/reference";

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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-xl border transition-all duration-300",
        isModified
          ? "border-primary/30 bg-primary/[0.02] shadow-sm shadow-primary/5"
          : "border-border bg-card hover:border-border/80 hover:shadow-sm"
      )}
    >
      {/* Modified indicator bar */}
      <div 
        className={cn(
          "absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary transition-all duration-300",
          isModified ? "opacity-100" : "opacity-0"
        )} 
      />

      <div className="p-4 pl-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            {/* Title row with badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor={id}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    isModified && "text-primary"
                  )}
                >
                  {name}
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`${GHOSTTY_DOCS_BASE_URL}#${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>View in Ghostty docs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Inline badges */}
              <div className="flex items-center gap-1.5">
                {isModified && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary animate-scale-in">
                    Modified
                  </span>
                )}
                {deprecated && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-destructive/10 text-destructive">
                    Deprecated
                  </span>
                )}
                {sinceVersion && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
                    v{sinceVersion}+
                  </span>
                )}
                {platform && platform.length > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
                    {platform.join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Description with info tooltip */}
            <div className="flex items-start gap-1.5 mt-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
              {note && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">{note}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* Reset button */}
          <div 
            className={cn(
              "transition-all duration-200",
              isModified && isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
            )}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    onClick={onReset}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Reset to default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Input area */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
