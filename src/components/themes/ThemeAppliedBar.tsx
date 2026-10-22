"use client";

import Link from "next/link";
import { ArrowRight, FileCode2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PreviewPaneTab } from "@/components/editor/PreviewPane";
import type { Theme } from "@/lib/utils/themes";

interface ThemeAppliedBarProps {
  /** The theme just applied, or null before anything was. */
  theme: Theme | null;
  /** `opener` is the clicked button, which gets focus back when the pane closes. */
  onOpenPane: (tab: PreviewPaneTab, opener: HTMLElement) => void;
}

/** Confirms an applied theme and offers the next step. Phones skip the pane buttons and keep the editor link. */
export function ThemeAppliedBar({ theme, onOpenPane }: ThemeAppliedBarProps) {
  return (
    // Always mounted so screen readers announce the text when a theme is applied.
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 md:bottom-5"
    >
      {theme && (
        <div className="pointer-events-auto flex w-full animate-fade-up items-center gap-2 rounded-xl border border-border bg-popover py-1.5 pr-1.5 pl-3.5 text-[13px] shadow-md motion-reduce:animate-none md:w-auto">
          <span aria-hidden="true" className="flex h-2.5 w-7 shrink-0 overflow-hidden rounded-[2px]">
            <span className="flex-1" style={{ backgroundColor: theme.colors.background }} />
            <span className="flex-1" style={{ backgroundColor: theme.colors.palette[1] || theme.colors.foreground }} />
            <span className="flex-1" style={{ backgroundColor: theme.colors.palette[4] || theme.colors.foreground }} />
          </span>
          <span className="min-w-0 flex-1 truncate">
            <strong className="font-semibold">{theme.name}</strong> applied
          </span>
          <Button variant="ghost" className="h-[34px] text-foreground max-sm:hidden" onClick={(event) => onOpenPane("preview", event.currentTarget)}>
            <Monitor className="size-3.5" aria-hidden="true" />
            Preview
          </Button>
          <Button variant="ghost" className="h-[34px] text-foreground max-sm:hidden" onClick={(event) => onOpenPane("config", event.currentTarget)}>
            <FileCode2 className="size-3.5" aria-hidden="true" />
            View config
          </Button>
          <Button asChild className="h-9">
            <Link href="/editor">
              Open editor
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
