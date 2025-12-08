"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, MobileCategoryBar } from "@/components/layout/Sidebar";
import { ConfigPanel } from "@/components/editor/ConfigPanel";
import { ConfigOutput } from "@/components/editor/ConfigOutput";
import { CommandSearch } from "@/components/editor/CommandSearch";
import { GhosttyPreview, PreviewToggleButton } from "@/components/preview";
import { Category, ConfigOption } from "@/lib/schema/types";

export default function EditorPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("fonts");
  const [previewOpen, setPreviewOpen] = useState(false);
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

        <main className="flex-1 animate-fade-in">
          <MobileCategoryBar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="relative">
            <ConfigPanel 
              category={activeCategory} 
              highlightedOption={highlightedOption}
            />

            {/* Ghostty Terminal Preview */}
            <GhosttyPreview
              isOpen={previewOpen}
              onToggle={() => setPreviewOpen(false)}
            />

            {/* Floating buttons */}
            <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
              <PreviewToggleButton
                isOpen={previewOpen}
                onToggle={() => setPreviewOpen(!previewOpen)}
              />
              <ConfigOutput />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
