"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, MobileCategoryBar } from "@/components/layout/Sidebar";
import { ConfigPanel } from "@/components/editor/ConfigPanel";
import { ConfigOutput } from "@/components/editor/ConfigOutput";
import { TerminalPreview, PreviewToggleButton } from "@/components/preview";
import { Category } from "@/lib/schema/types";

export default function EditorPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("fonts");
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
            <ConfigPanel category={activeCategory} />

            {/* Terminal Preview */}
            <TerminalPreview
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
