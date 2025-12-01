"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingRenderer } from "@/components/settings";
import { getOptionsByCategory } from "@/data/ghostty-options";
import { categories } from "@/data/categories";
import { Category } from "@/lib/schema/types";

interface ConfigPanelProps {
  category: Category;
}

export function ConfigPanel({ category }: ConfigPanelProps) {
  const options = getOptionsByCategory(category);
  const categoryInfo = categories.find((c) => c.id === category);

  return (
    <ScrollArea className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{categoryInfo?.name}</h1>
          {categoryInfo?.description && (
            <p className="text-muted-foreground mt-1">
              {categoryInfo.description}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {options.map((option) => (
            <SettingRenderer key={option.id} option={option} />
          ))}
        </div>

        {options.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No options available for this category.
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
