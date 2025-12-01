"use client";

import { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-colors",
        isModified
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card hover:border-border/80"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <label
              htmlFor={id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {name}
            </label>
            {isModified && (
              <Badge variant="secondary" className="text-xs">
                Modified
              </Badge>
            )}
            {deprecated && (
              <Badge variant="destructive" className="text-xs">
                Deprecated
              </Badge>
            )}
            {sinceVersion && (
              <Badge variant="outline" className="text-xs">
                v{sinceVersion}+
              </Badge>
            )}
            {platform && platform.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {platform.join(", ")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {note && (
            <p className="text-xs text-amber-500 dark:text-amber-400">
              Note: {note}
            </p>
          )}
        </div>

        {isModified && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={onReset}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset to default</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}
