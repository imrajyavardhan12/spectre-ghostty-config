"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, MobileCategoryBar } from "@/components/layout/Sidebar";
import { ConfigPanel } from "@/components/editor/ConfigPanel";
import { ConfigOutput } from "@/components/editor/ConfigOutput";
import { FloatingActions } from "@/components/editor/FloatingActions";
import { CommandSearch } from "@/components/editor/CommandSearch";
import { PreviewToggleButton } from "@/components/preview";
import { PreviewPane, type PreviewPaneTab } from "@/components/editor/PreviewPane";
import { PreviewSheet } from "@/components/editor/PreviewSheet";
import { MobileActionBar } from "@/components/editor/MobileActionBar";
import { Category, ConfigOption } from "@/lib/schema/types";
import { useMediaQuery, WIDE_QUERY } from "@/lib/hooks/use-media-query";

const PANE_STORAGE_KEY = "spectre-preview-pane";

/** Pane open/collapsed is a per-browser convenience; storage may be unavailable. */
function readPaneOpen(): boolean {
  try {
    return window.localStorage.getItem(PANE_STORAGE_KEY) !== "closed";
  } catch {
    return true;
  }
}

export default function EditorPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("fonts");
  const [sheetOpen, setSheetOpen] = useState(false);
  // The docked preview pane needs room for a readable settings column beside it.
  const isWide = useMediaQuery(WIDE_QUERY);
  const [paneOpen, setPaneOpenState] = useState(() => (typeof window === "undefined" ? true : readPaneOpen()));
  const [paneTab, setPaneTab] = useState<PreviewPaneTab>("preview");
  const docked = isWide && paneOpen;

  const setPaneOpen = useCallback((open: boolean) => {
    setPaneOpenState(open);
    try {
      window.localStorage.setItem(PANE_STORAGE_KEY, open ? "open" : "closed");
    } catch {
      // Remembering the choice is optional.
    }
  }, []);

  // Wide screens dock the pane; narrower ones open it as a sheet over the settings.
  // The docked pane takes over when the window widens, so a sheet left open must not come back later.
  const [wasWide, setWasWide] = useState(isWide);
  if (wasWide !== isWide) {
    setWasWide(isWide);
    if (isWide) setSheetOpen(false);
  }

  const openPane = useCallback((tab: PreviewPaneTab) => {
    setPaneTab(tab);
    if (isWide) setPaneOpen(true);
    else setSheetOpen(true);
  }, [isWide, setPaneOpen]);
  const [highlightedOption, setHighlightedOption] = useState<string | null>(null);

  const handleSelectOption = useCallback((option: ConfigOption) => {
    // Switch to the option's category
    setActiveCategory(option.category);
    // Highlight the option briefly
    setHighlightedOption(option.id);
    // Scroll to the option after a brief delay for category switch
    setTimeout(() => {
      const element = document.getElementById(`option-${option.id}`);
      if (element) {
        // Rows carry a scroll margin that clears the sticky group bar.
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
      // Clear highlight after animation
      setTimeout(() => setHighlightedOption(null), 2400);
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Command Search (Cmd+K) */}
      <CommandSearch onSelectOption={handleSelectOption} />

      <div className="flex">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Fills the space under the header so only the options list scrolls, never the window. */}
        <main className="flex h-[calc(100dvh-3.5rem)] min-w-0 flex-1 animate-fade-in flex-col">
          <MobileCategoryBar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="relative min-h-0 flex-1">
            <ConfigPanel 
              category={activeCategory} 
              highlightedOption={highlightedOption}
            />

            {/* Floating buttons open the docked pane, or the sheet on narrower screens. Phones have the bottom bar. */}
            {!docked && (
              <FloatingActions
                className="max-md:hidden"
                preview={<PreviewToggleButton onOpen={() => openPane("preview")} />}
                config={<ConfigOutput onOpen={() => openPane("config")} />}
              />
            )}
          </div>

          <MobileActionBar onOpen={openPane} />
        </main>

        {docked && (
          <PreviewPane tab={paneTab} onTabChange={setPaneTab} onCollapse={() => setPaneOpen(false)} />
        )}
      </div>

      {!isWide && (
        <PreviewSheet open={sheetOpen} onOpenChange={setSheetOpen} tab={paneTab} onTabChange={setPaneTab} />
      )}
    </div>
  );
}
