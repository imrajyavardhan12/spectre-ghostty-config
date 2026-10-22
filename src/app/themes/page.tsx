"use client";

import { useRef, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ThemeBrowser } from "@/components/themes";
import { ThemeAppliedBar } from "@/components/themes/ThemeAppliedBar";
import { PreviewSheet } from "@/components/editor/PreviewSheet";
import type { PreviewPaneTab } from "@/components/editor/PreviewPane";
import type { Theme } from "@/lib/utils/themes";

export default function ThemesPage() {
  const [appliedTheme, setAppliedTheme] = useState<Theme | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paneTab, setPaneTab] = useState<PreviewPaneTab>("preview");
  const openerRef = useRef<HTMLElement | null>(null);

  const openPane = (tab: PreviewPaneTab, opener: HTMLElement) => {
    // Safari does not focus a button on click, so the clicked element is the reliable target.
    openerRef.current = opener;
    setPaneTab(tab);
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader crumb="Themes" />

      {/* Leaves room under the footer for the applied bar. */}
      <main
        className={`mx-auto w-full max-w-[1200px] px-4 pt-7 sm:px-8 md:pt-11 xl:pt-14 ${appliedTheme ? "pb-28" : "pb-10"}`}
      >
        <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] sm:text-[32px]">Themes</h1>
        <p className="mt-2 max-w-[560px] text-[15px] leading-[1.55] text-pretty text-muted-foreground">
          Hundreds of color schemes from the iTerm2 Color Schemes collection. Apply one, then keep
          customizing in the editor.
        </p>

        <ThemeBrowser onApplied={setAppliedTheme} />

        <div className="mt-12 border-t border-border pt-5 text-[13px] text-muted-foreground">
          Themes from{" "}
          <a
            href="https://github.com/mbadolato/iTerm2-Color-Schemes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary-hover"
          >
            iTerm2-Color-Schemes
          </a>
          . Thanks to everyone who contributes to it.
        </div>
      </main>

      <ThemeAppliedBar theme={appliedTheme} onOpenPane={openPane} />

      <PreviewSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tab={paneTab}
        onTabChange={setPaneTab}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          openerRef.current?.focus();
        }}
      />
    </div>
  );
}
