"use client";

import { useState } from "react";
import { ChevronRight, Layers, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useConfigStore } from "@/lib/store/config-store";
import { useToastStore } from "@/lib/store/toast-store";
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { configValuesEqual, normalizeConfigValues } from "@/lib/utils/config-normalization";
import { presets, presetCategories, searchPresets, ConfigPreset } from "@/data/presets";
import { cn } from "@/lib/utils";

const PLATFORM_LABELS: Record<string, string> = { macos: "macOS", linux: "Linux", windows: "Windows" };

/** The exact Ghostty lines a preset writes, as the exporter would emit them. */
function presetConfigLines(preset: ConfigPreset): string[] {
  return exportGhosttyConfig(normalizeConfigValues(preset.config))
    .split("\n")
    .filter((line) => line && !line.startsWith("#"));
}

interface PresetCardProps {
  preset: ConfigPreset;
  onApply: (preset: ConfigPreset) => void;
}

function PresetCard({ preset, onApply }: PresetCardProps) {
  const headingId = `preset-${preset.id}-name`;
  const lines = presetConfigLines(preset);
  const group = presetCategories.find((category) => category.id === preset.category)?.name;

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-card px-4 py-3.5"
    >
      <div className="flex items-baseline gap-2">
        <h4 id={headingId} className="text-[15px] font-semibold">{preset.name}</h4>
        <span className="text-[11px] text-subtle-foreground">{group}</span>
      </div>
      <p className="text-[13px] leading-normal text-pretty text-muted-foreground">{preset.description}</p>

      {(preset.fonts.length > 0 || preset.platforms) && (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {preset.fonts.length > 0 && <li>Requires font: {preset.fonts.join(", ")}</li>}
          {preset.platforms && (
            <li>Fully applies on {preset.platforms.map((platform) => PLATFORM_LABELS[platform]).join(", ")}</li>
          )}
        </ul>
      )}

      <details className="group">
        <summary className="flex h-[30px] w-fit cursor-pointer list-none items-center gap-1 rounded-md pr-1.5 text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
          What it sets · {lines.length} {lines.length === 1 ? "line" : "lines"}
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-[7px] bg-muted p-3 font-mono text-xs leading-[1.7] whitespace-pre-wrap break-all">
          {lines.join("\n")}
        </pre>
      </details>

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onApply(preset)}
          aria-label={`Apply ${preset.name} preset`}
          className="h-[30px] border-border-strong hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          Apply
        </Button>
      </div>
    </article>
  );
}

interface PresetsDialogProps {
  /** Opens the dialog. Pass `null` to render no trigger and control `open` from outside. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus goes on close when the dialog was opened without its own trigger. */
  onCloseAutoFocus?: (event: Event) => void;
}

type PresetFilter = "all" | ConfigPreset["category"];

const FILTERS: Array<{ id: PresetFilter; name: string }> = [
  { id: "all", name: "All" },
  ...presetCategories.map(({ id, name }) => ({ id, name })),
];

export function PresetsDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  onCloseAutoFocus,
}: PresetsDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<PresetFilter>("all");
  const [notice, setNotice] = useState("");
  const loadConfig = useConfigStore((state) => state.loadConfig);

  const handleOpenChange = (next: boolean) => {
    // Each visit starts fresh, so a stale search never hides the presets.
    if (!next) {
      setSearchQuery("");
      setFilter("all");
      setNotice("");
    }
    setOpen(next);
  };

  const query = searchQuery.trim();
  const visiblePresets = (query ? searchPresets(query) : presets).filter(
    (preset) => filter === "all" || preset.category === filter
  );

  const handleApplyPreset = (preset: ConfigPreset) => {
    const before = useConfigStore.getState().config;
    // loadConfig replaces the whole config as a single undo step.
    loadConfig(preset.config);
    const after = useConfigStore.getState().config;
    if (configValuesEqual(before, after)) {
      // Nothing to undo and nothing changed: stay open and say so.
      setNotice(`${preset.name} is already applied.`);
      return;
    }
    handleOpenChange(false);
    const count = Object.keys(after).length;
    useToastStore.getState().show(
      `Applied ${preset.name} · ${count} ${count === 1 ? "setting" : "settings"} replaced`,
      "success"
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <Layers className="h-4 w-4" />
              Presets
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent
        showCloseButton={false}
        onCloseAutoFocus={onCloseAutoFocus}
        className="flex h-[640px] max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-hidden rounded-[14px] bg-popover p-0 shadow-lg sm:max-w-[880px] max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-h-none max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none"
      >
        <div className="flex shrink-0 items-start gap-3 px-[22px] pt-5 pb-3.5">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[17px] leading-snug font-semibold tracking-[-0.01em]">
              Presets
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-normal text-pretty">
              Curated configs, checked against the Ghostty reference. Applying one replaces your
              settings. Undo brings them back.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="-mt-1 -mr-1.5 size-8" aria-label="Close">
              <X className="size-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-border px-[22px] pb-3.5">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2 text-subtle-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search presets"
              aria-label="Search presets"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-9 pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={cn(
                  "h-8 rounded-full border px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  filter === id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border-strong text-muted-foreground hover:text-foreground"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pt-4 pb-[22px]">
          <p role="status" className={notice ? "mb-3 text-[13px] text-muted-foreground" : "sr-only"}>
            {notice}
          </p>
          {visiblePresets.length > 0 ? (
            <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
              {visiblePresets.map((preset) => (
                <PresetCard key={preset.id} preset={preset} onApply={handleApplyPreset} />
              ))}
            </div>
          ) : (
            <p role="status" className="py-12 text-center text-sm text-muted-foreground">
              No presets found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
