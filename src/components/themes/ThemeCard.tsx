"use client";

import { useId } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Theme, categorizeTheme } from "@/lib/utils/themes";
import { cn } from "@/lib/utils";

interface ThemeCardProps {
  theme: Theme;
  isActive?: boolean;
  onApply: (theme: Theme) => void;
}

export function ThemeCard({ theme, isActive, onApply }: ThemeCardProps) {
  const titleId = useId();

  const isDark = categorizeTheme(theme) === "dark";
  const KindIcon = isDark ? Moon : Sun;
  const { background, foreground, palette } = theme.colors;

  // Get 8 main colors from palette for preview
  const previewColors = palette.slice(0, 8).filter(Boolean);

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col overflow-hidden rounded-[11px] border border-border bg-card transition-[transform,box-shadow,border-color] duration-200 hover:border-border-strong hover:shadow-md motion-safe:hover:-translate-y-0.5"
    >
      {/* Terminal sample. The colors belong to the theme, so they are not held to the page's contrast. */}
      <div
        aria-hidden="true"
        className="px-3.5 pt-3.5 pb-3 font-mono text-xs leading-[1.65]"
        style={{ backgroundColor: background, color: foreground }}
      >
        <div className="truncate">
          <span style={{ color: palette[2] || "#4ec9b0" }}>~</span>{" "}
          <span style={{ color: palette[4] || "#569cd6" }}>echo</span>{" "}
          <span style={{ color: palette[3] || "#ce9178" }}>&quot;Hello, Ghostty&quot;</span>
        </div>
        <div>Hello, Ghostty</div>
        <div className="truncate">
          <span style={{ color: palette[2] || "#4ec9b0" }}>~</span>{" "}
          <span style={{ color: palette[1] || "#f44747" }}>git</span> status{" "}
          <span style={{ color: palette[5] || "#c586c0" }}>--short</span>
        </div>
        <div>
          <span style={{ color: palette[2] || "#4ec9b0" }}>~</span>{" "}
          <span
            className="inline-block h-[1.1em] w-[0.6em] align-[-0.2em]"
            style={{ backgroundColor: theme.colors.cursorColor || foreground }}
          />
        </div>
      </div>

      {/* Color palette strip */}
      <div aria-hidden="true" className="flex h-1.5">
        {previewColors.length > 0
          ? previewColors.map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))
          : Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: `hsl(${i * 45}, 70%, 50%)` }}
                />
              ))}
      </div>

      {/* Info and action */}
      <div className="flex items-center gap-2.5 py-3 pr-3 pl-3.5">
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-sm font-medium" title={theme.name}>
            {theme.name}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <KindIcon className="size-3" aria-hidden="true" />
            {isDark ? "Dark" : "Light"}
            <span className="sr-only"> theme</span>
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onApply(theme)}
          aria-label={isActive ? `Applied ${theme.name} theme` : `Apply ${theme.name} theme`}
          className={cn(
            isActive && "border-transparent bg-accent text-accent-foreground hover:bg-accent"
          )}
        >
          {isActive && <Check className="size-3.5" aria-hidden="true" />}
          {isActive ? "Applied" : "Apply"}
        </Button>
      </div>
    </article>
  );
}

// Skeleton loader for theme card
export function ThemeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[11px] border border-border bg-card">
      <div className="h-[98px] animate-pulse bg-muted motion-reduce:animate-none" />
      <div className="flex items-center gap-2.5 p-3.5">
        <div className="flex flex-1 flex-col gap-[7px]">
          <div className="h-2.5 w-3/5 rounded-[3px] bg-muted" />
          <div className="h-2 w-1/3 rounded-[3px] bg-muted" />
        </div>
        <div className="h-8 w-16 rounded-[7px] bg-muted" />
      </div>
    </div>
  );
}
