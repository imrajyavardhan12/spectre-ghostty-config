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
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { normalizeConfigValues } from "@/lib/utils/config-normalization";
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
  Presentation,
};

const PLATFORM_LABELS: Record<string, string> = { macos: "macOS", linux: "Linux", windows: "Windows" };

/** The exact Ghostty lines a preset writes, as the exporter would emit them. */
function presetConfigLines(preset: ConfigPreset): string[] {
  return exportGhosttyConfig(normalizeConfigValues(preset.config))
    .split("\n")
    .filter((line) => line && !line.startsWith("#"));
}

interface PresetCardProps {
  preset: ConfigPreset;
  applied: boolean;
  onApply: (preset: ConfigPreset) => void;
}

function PresetCard({ preset, applied, onApply }: PresetCardProps) {
  const Icon = iconMap[preset.icon] || Sparkles;
  const headingId = `preset-${preset.id}-name`;
  const lines = presetConfigLines(preset);

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "rounded-xl border p-4 transition-colors duration-200",
        applied ? "border-primary bg-primary/10" : "hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            applied ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {applied ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 id={headingId} className="font-medium text-sm">{preset.name}</h4>
            {applied && (
              <Badge variant="default" className="text-[10px] h-4">
                Applied
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>

          {(preset.fonts.length > 0 || preset.platforms) && (
            <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {preset.fonts.length > 0 && (
                <li>Requires font: {preset.fonts.join(", ")}</li>
              )}
              {preset.platforms && (
                <li>
                  Fully applies on {preset.platforms.map((platform) => PLATFORM_LABELS[platform]).join(", ")}
                </li>
              )}
            </ul>
          )}

          <details className="mt-2 group">
            <summary className="cursor-pointer text-xs font-medium text-foreground/80 hover:text-foreground">
              What it sets ({lines.length} {lines.length === 1 ? "line" : "lines"})
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted/60 p-2 text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-all">
              {lines.join("\n")}
            </pre>
          </details>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {preset.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              size="sm"
              variant={applied ? "secondary" : "default"}
              onClick={() => onApply(preset)}
              aria-label={`Apply ${preset.name} preset`}
              className="shrink-0"
            >
              {applied ? "Applied" : "Apply"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

interface PresetsDialogProps {
  trigger?: React.ReactNode;
}

export function PresetsDialog({ trigger }: PresetsDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedPreset, setAppliedPreset] = useState<ConfigPreset | null>(null);
  const loadConfig = useConfigStore((state) => state.loadConfig);

  const filteredPresets = searchQuery
    ? searchPresets(searchQuery)
    : presets;

  const handleApplyPreset = (preset: ConfigPreset) => {
    // loadConfig replaces the whole config as a single undo step.
    loadConfig(preset.config);
    setAppliedPreset(preset);
  };

  const renderCard = (preset: ConfigPreset) => (
    <PresetCard
      key={preset.id}
      preset={preset}
      applied={appliedPreset?.id === preset.id}
      onApply={handleApplyPreset}
    />
  );

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
      <SheetContent className="w-full sm:max-w-lg p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configuration Presets
          </SheetTitle>
          <SheetDescription>
            Curated configurations checked against the Ghostty reference. Applying one replaces your current settings; Undo brings them back.
          </SheetDescription>
        </SheetHeader>

        <p role="status" className="sr-only">
          {appliedPreset
            ? `${appliedPreset.name} preset applied. Undo restores your previous settings.`
            : ""}
        </p>

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
                  filteredPresets.map(renderCard)
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
              <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 rounded-xl">
                {presetCategories.map(cat => (
                  <TabsTrigger 
                    key={cat.id} 
                    value={cat.id}
                    className="text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {presetCategories.map(cat => (
                <TabsContent key={cat.id} value={cat.id} className="animate-fade-in">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    <div className="space-y-3 pr-4 pt-2">
                      <p className="text-xs text-muted-foreground mb-3">
                        {cat.description}
                      </p>
                      {presets
                        .filter(p => p.category === cat.id)
                        .map(renderCard)}
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
