"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, MobileCategoryBar } from "@/components/layout/Sidebar";
import { ConfigPanel } from "@/components/editor/ConfigPanel";
import { ConfigOutput } from "@/components/editor/ConfigOutput";
import { Category } from "@/lib/schema/types";

export default function EditorPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("fonts");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <Sidebar
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <main className="flex-1">
          <MobileCategoryBar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          <div className="relative">
            <ConfigPanel category={activeCategory} />

            {/* Floating config output button */}
            <div className="fixed bottom-6 right-6 z-40">
              <ConfigOutput />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
