"use client";

import { cn } from "@/lib/utils";
import { categories } from "@/data/categories";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronRight,
} from "lucide-react";
import { Category } from "@/lib/schema/types";
import { useConfigStore } from "@/lib/store/config-store";
import { getOptionsByCategory } from "@/data/ghostty-options";

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
  const config = useConfigStore((state) => state.config);

  const getModifiedCount = (categoryId: Category): number => {
    const options = getOptionsByCategory(categoryId);
    return options.filter((opt) => opt.id in config).length;
  };

  return (
    <aside className="w-60 border-r border-border bg-background hidden md:flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Categories
          </p>
          {categories.map((category, index) => {
            const Icon = iconMap[category.icon || "Settings"] || Settings;
            const isActive = activeCategory === category.id;
            const modifiedCount = getModifiedCount(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  "opacity-0 animate-slide-in-left",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
              >
                {/* Active indicator */}
                <div 
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0"
                  )} 
                />
                
                <Icon className={cn(
                  "h-4 w-4 transition-colors duration-200 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                <span className="flex-1 text-left truncate">{category.name}</span>
                
                {/* Modified count badge */}
                {modifiedCount > 0 && (
                  <span className={cn(
                    "min-w-5 h-5 flex items-center justify-center text-xs rounded-full transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {modifiedCount}
                  </span>
                )}
                
                {/* Arrow indicator */}
                <ChevronRight className={cn(
                  "h-4 w-4 transition-all duration-200",
                  isActive 
                    ? "opacity-100 translate-x-0 text-primary" 
                    : "opacity-0 -translate-x-2 text-muted-foreground"
                )} />
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <a
          href="https://ghostty.org/docs/config"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Ghostty Docs</span>
        </a>
      </div>
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
  const config = useConfigStore((state) => state.config);

  const getModifiedCount = (categoryId: Category): number => {
    const options = getOptionsByCategory(categoryId);
    return options.filter((opt) => opt.id in config).length;
  };

  return (
    <div className="md:hidden border-b border-border bg-background sticky top-14 z-40">
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex p-2 gap-1.5">
          {categories.map((category) => {
            const Icon = iconMap[category.icon || "Settings"] || Settings;
            const isActive = activeCategory === category.id;
            const modifiedCount = getModifiedCount(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{category.name}</span>
                {modifiedCount > 0 && (
                  <span className={cn(
                    "min-w-4 h-4 flex items-center justify-center text-[10px] rounded-full",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {modifiedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
