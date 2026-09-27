"use client";

// PROTOTYPE — throwaway. Three alternative editor layouts, switched by `?variant=`
// on /editor (A is the current layout, rendered by page.tsx). Question: does a
// persistent split make the editor clearer without crowding it, and what should
// the right-hand pane show by default? Read-only except the store actions the
// real editor already uses.

import { useState } from "react";
import { Check, Copy, CornerDownRight, Download, Eye, EyeOff, FileText, Link2, Monitor, RotateCcw } from "lucide-react";
import { Sidebar, MobileCategoryBar } from "@/components/layout/Sidebar";
import { ConfigPanel } from "@/components/editor/ConfigPanel";
import { ConfigOutput } from "@/components/editor/ConfigOutput";
import { GhosttyPreview, PreviewToggleButton } from "@/components/preview";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/lib/store/config-store";
import { getConfigOption } from "@/lib/utils/config-options";
import { generateShareUrl } from "@/lib/utils/url-share";
import type { Category, ConfigOption } from "@/lib/schema/types";
import { cn } from "@/lib/utils";

export interface VariantProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  highlightedOption: string | null;
  onSelectOption: (option: ConfigOption) => void;
}

/** Labeled Copy / Download / Share, the actions every visit ends with. */
function ExportActions({ compact = false }: { compact?: boolean }) {
  const config = useConfigStore((state) => state.config);
  const appliedTheme = useConfigStore((state) => state.appliedTheme);
  const exportConfig = useConfigStore((state) => state.exportConfig);
  const [done, setDone] = useState<string | null>(null);
  const flash = (key: string) => {
    setDone(key);
    setTimeout(() => setDone(null), 1500);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(exportConfig());
    flash("copy");
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportConfig()], { type: "application/octet-stream" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "config" });
    a.click();
    URL.revokeObjectURL(url);
  };
  const share = async () => {
    await navigator.clipboard.writeText(generateShareUrl(config, appliedTheme));
    flash("share");
  };

  return (
    <div className={cn("flex gap-2", compact ? "items-center" : "flex-col")}>
      <Button onClick={copy} size="sm" className="gap-1.5">
        {done === "copy" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {done === "copy" ? "Copied" : "Copy config"}
      </Button>
      <div className="flex gap-2">
        <Button onClick={download} size="sm" variant="outline" className="gap-1.5 flex-1">
          <Download className="h-4 w-4" /> Download
        </Button>
        <Button onClick={share} size="sm" variant="outline" className="gap-1.5 flex-1">
          {done === "share" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {done === "share" ? "Link copied" : "Share"}
        </Button>
      </div>
    </div>
  );
}

function ConfigFileView() {
  const exportConfig = useConfigStore((state) => state.exportConfig);
  useConfigStore((state) => state.config); // re-render on changes
  return (
    <pre className="h-full overflow-auto p-4 text-xs leading-relaxed font-mono">
      {exportConfig()
        .split("\n")
        .map((line, index) => (
          <div key={index} className={line.startsWith("#") ? "text-muted-foreground" : "text-foreground"}>
            {line || " "}
          </div>
        ))}
    </pre>
  );
}

/** B — Workbench: categories | settings | persistent Preview/Config pane. */
export function VariantB({ activeCategory, onCategoryChange, highlightedOption }: VariantProps) {
  const [tab, setTab] = useState<"preview" | "config">("preview");
  const modified = useConfigStore((state) => Object.keys(state.config).length);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="flex">
      <Sidebar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
      <main className="min-w-0 flex-1">
        <MobileCategoryBar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
        <ConfigPanel category={activeCategory} highlightedOption={highlightedOption} />
        {/* Below xl the pane doesn't fit: keep today's floating controls. */}
        <div className="xl:hidden">
          <GhosttyPreview isOpen={previewOpen} onToggle={() => setPreviewOpen(false)} />
          <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
            <PreviewToggleButton isOpen={previewOpen} onToggle={() => setPreviewOpen(!previewOpen)} />
            <ConfigOutput />
          </div>
        </div>
      </main>
      <aside className="hidden xl:flex w-[42%] max-w-[680px] shrink-0 flex-col border-l border-border h-[calc(100vh-3.5rem)] sticky top-14">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div role="tablist" className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {(["preview", "config"] as const).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium",
                  tab === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {key === "preview" ? <Monitor className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {key === "preview" ? "Preview" : `Config (${modified})`}
              </button>
            ))}
          </div>
          <ExportActions compact />
        </div>
        <div className="min-h-0 flex-1 p-3">
          {tab === "preview" ? (
            <GhosttyPreview isOpen onToggle={() => setTab("config")} dockedHeight="calc(100vh - 3.5rem - 7.5rem)" />
          ) : (
            <div className="h-full rounded-lg border border-border bg-card">
              <ConfigFileView />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/** C — Changes rail: categories | settings | what you changed, with export at hand. */
export function VariantC({ activeCategory, onCategoryChange, highlightedOption, onSelectOption }: VariantProps) {
  const config = useConfigStore((state) => state.config);
  const resetValue = useConfigStore((state) => state.resetValue);
  const [previewOpen, setPreviewOpen] = useState(false);
  const entries = Object.entries(config);

  return (
    <div className="flex">
      <Sidebar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
      <main className="min-w-0 flex-1">
        <MobileCategoryBar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
        <ConfigPanel category={activeCategory} highlightedOption={highlightedOption} />
        <GhosttyPreview isOpen={previewOpen} onToggle={() => setPreviewOpen(false)} />
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 lg:right-[21rem]">
          <PreviewToggleButton isOpen={previewOpen} onToggle={() => setPreviewOpen(!previewOpen)} />
        </div>
      </main>
      <aside className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border h-[calc(100vh-3.5rem)] sticky top-14">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Your changes</h2>
          <p className="text-xs text-muted-foreground">
            {entries.length === 0
              ? "Nothing yet. Ghostty's defaults apply."
              : `${entries.length} ${entries.length === 1 ? "setting differs" : "settings differ"} from Ghostty's defaults`}
          </p>
        </div>
        <ul className="min-h-0 flex-1 overflow-auto divide-y divide-border">
          {entries.map(([key, value]) => {
            const option = getConfigOption(key);
            const shown = Array.isArray(value) ? `${value.length} ${value.length === 1 ? "entry" : "entries"}` : String(value);
            return (
              <li key={key} className="group px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{option?.name ?? key}</span>
                  <div className="flex shrink-0 gap-1 opacity-60 group-hover:opacity-100">
                    {option && (
                      <button aria-label={`Go to ${option.name}`} onClick={() => onSelectOption(option)} className="rounded p-1 hover:bg-muted">
                        <CornerDownRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button aria-label={`Reset ${option?.name ?? key}`} onClick={() => resetValue(key)} className="rounded p-1 hover:bg-muted">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {key} = <span className="text-primary">{shown}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="space-y-2 border-t border-border p-4">
          <ExportActions />
          <div className="[&>button]:w-full">
            <ConfigOutput />
          </div>
        </div>
      </aside>
    </div>
  );
}

/** D — Preview on top: live terminal docked above the settings column. */
export function VariantD({ activeCategory, onCategoryChange, highlightedOption }: VariantProps) {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="flex">
      <Sidebar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
      <main className="min-w-0 flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
        <MobileCategoryBar activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
        <div className="shrink-0 border-b border-border bg-muted/20 px-6 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? "Hide preview" : "Show preview"}
              </button>
              <ExportActions compact />
            </div>
            {showPreview && (
              <GhosttyPreview isOpen onToggle={() => setShowPreview(false)} dockedHeight="220px" />
            )}
          </div>
        </div>
        <ConfigPanel
          category={activeCategory}
          highlightedOption={highlightedOption}
          scrollClassName="min-h-0 flex-1"
        />
      </main>
    </div>
  );
}
