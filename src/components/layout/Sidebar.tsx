"use client";

import { cn } from "@/lib/utils";
import { categories } from "@/data/categories";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Type,
  Palette,
  AppWindow,
  MousePointer2,
  Mouse,
  Clipboard,
  Keyboard,
  Terminal,
  Settings,
  TerminalSquare,
  Apple,
  Monitor,
  Wrench,
} from "lucide-react";
import { Category } from "@/lib/schema/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Palette,
  AppWindow,
  MousePointer2,
  Mouse,
  Clipboard,
  Keyboard,
  Terminal,
  Settings,
  TerminalSquare,
  Apple,
  Monitor,
  Wrench,
};

interface SidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  return (
    <aside className="w-64 border-r bg-muted/30 hidden md:block">
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Categories
          </p>
          {categories.map((category) => {
            const Icon = iconMap[category.icon || "Settings"] || Settings;
            return (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  activeCategory === category.id && "bg-secondary"
                )}
                onClick={() => onCategoryChange(category.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}

interface MobileSidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export function MobileCategoryBar({
  activeCategory,
  onCategoryChange,
}: MobileSidebarProps) {
  return (
    <div className="md:hidden border-b bg-background overflow-x-auto">
      <div className="flex p-2 gap-1">
        {categories.map((category) => {
          const Icon = iconMap[category.icon || "Settings"] || Settings;
          return (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "secondary" : "ghost"}
              size="sm"
              className="flex-shrink-0 gap-1"
              onClick={() => onCategoryChange(category.id)}
            >
              <Icon className="h-3 w-3" />
              <span className="text-xs">{category.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
