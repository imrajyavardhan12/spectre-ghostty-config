"use client";

import { useState } from "react";
import {
  Minus,
  Armchair,
  Zap,
  Code,
  Server,
  Monitor,
  Moon,
  Sun,
  Gauge,
  Presentation,
  Search,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfigStore } from "@/lib/store/config-store";
import { presets, presetCategories, searchPresets, ConfigPreset } from "@/data/presets";
import { cn } from "@/lib/utils";

// Icon map for preset icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Minus,
  Armchair,
  Zap,
  Code,
  Server,
  Monitor,
  Moon,
  Sun,
  Gauge,
  Presentation,
};

interface PresetsDialogProps {
  trigger?: React.ReactNode;
}

export function PresetsDialog({ trigger }: PresetsDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  const { loadConfig, resetAll } = useConfigStore();

  const filteredPresets = searchQuery 
    ? searchPresets(searchQuery)
    : presets;

  const handleApplyPreset = (preset: ConfigPreset) => {
    resetAll();
    loadConfig(preset.config);
    setAppliedPreset(preset.id);
    
    // Close after a brief delay to show the checkmark
    setTimeout(() => {
      setOpen(false);
      setAppliedPreset(null);
    }, 600);
  };

  const PresetCard = ({ preset }: { preset: ConfigPreset }) => {
    const Icon = iconMap[preset.icon] || Sparkles;
    const isApplied = appliedPreset === preset.id;

    return (
      <button
        onClick={() => handleApplyPreset(preset)}
        className={cn(
          "w-full text-left p-4 rounded-xl border transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
          isApplied && "border-primary bg-primary/10"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isApplied ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {isApplied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{preset.name}</h4>
              {isApplied && (
                <Badge variant="default" className="text-[10px] h-4">
                  Applied
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {preset.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {preset.tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-[10px] h-4 px-1.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Presets
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configuration Presets
          </SheetTitle>
          <SheetDescription>
            Quick-start configurations for different use cases. Applying a preset will replace your current settings.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Presets List */}
          {searchQuery ? (
            // Show search results
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                {filteredPresets.length > 0 ? (
                  filteredPresets.map(preset => (
                    <PresetCard key={preset.id} preset={preset} />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No presets found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            // Show categorized presets
            <Tabs defaultValue="starter" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                {presetCategories.map(cat => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="text-xs"
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {presetCategories.map(cat => (
                <TabsContent key={cat.id} value={cat.id}>
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="space-y-3 pr-4 pt-2">
                      <p className="text-xs text-muted-foreground mb-3">
                        {cat.description}
                      </p>
                      {presets
                        .filter(p => p.category === cat.id)
                        .map(preset => (
                          <PresetCard key={preset.id} preset={preset} />
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
