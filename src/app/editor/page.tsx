"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, MobileCategoryBar } from "@/components/layout/Sidebar";
import { ConfigPanel } from "@/components/editor/ConfigPanel";
import { ConfigOutput } from "@/components/editor/ConfigOutput";
import { CommandSearch } from "@/components/editor/CommandSearch";
import { GhosttyPreview, PreviewToggleButton } from "@/components/preview";
import { PreviewPane, type PreviewPaneTab } from "@/components/editor/PreviewPane";
import { Category, ConfigOption } from "@/lib/schema/types";

// The docked preview pane needs room for a readable settings column beside it.
const WIDE_QUERY = "(min-width: 1280px)";
const PANE_STORAGE_KEY = "spectre-preview-pane";

function subscribeToWide(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsWide(): boolean {
  return useSyncExternalStore(subscribeToWide, () => window.matchMedia(WIDE_QUERY).matches, () => false);
}

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const isWide = useIsWide();
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

  const openPane = useCallback((tab: PreviewPaneTab) => {
    setPaneTab(tab);
    setPaneOpen(true);
  }, [setPaneOpen]);
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
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Clear highlight after animation
      setTimeout(() => setHighlightedOption(null), 2000);
    }, 100);
  }, []);

  const handleSelectCategory = useCallback((category: Category) => {
    setActiveCategory(category);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Command Search (Cmd+K) */}
      <CommandSearch 
        onSelectOption={handleSelectOption}
        onSelectCategory={handleSelectCategory}
      />

      <div className="flex">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <main className="min-w-0 flex-1 animate-fade-in">
          <MobileCategoryBar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="relative">
            <ConfigPanel 
              category={activeCategory} 
              highlightedOption={highlightedOption}
            />

            {/* Narrow screens: floating preview window and config sheet. */}
            {!isWide && (
              <GhosttyPreview
                isOpen={previewOpen}
                onToggle={() => setPreviewOpen(false)}
              />
            )}

            {/* Floating buttons; on wide screens they reopen the docked pane. */}
            {!docked && (
              <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
                <PreviewToggleButton
                  isOpen={!isWide && previewOpen}
                  onToggle={() => (isWide ? openPane("preview") : setPreviewOpen(!previewOpen))}
                />
                <ConfigOutput onOpen={isWide ? () => openPane("config") : undefined} />
              </div>
            )}
          </div>
        </main>

        {docked && (
          <PreviewPane tab={paneTab} onTabChange={setPaneTab} onCollapse={() => setPaneOpen(false)} />
        )}
      </div>
    </div>
  );
}
