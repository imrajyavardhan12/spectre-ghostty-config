"use client";

import { FileText, Monitor, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigFileContent } from "@/components/editor/ConfigOutput";
import { GhosttyPreview } from "@/components/preview";
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";

export type PreviewPaneTab = "preview" | "config";

interface PreviewPaneProps {
  tab: PreviewPaneTab;
  onTabChange: (tab: PreviewPaneTab) => void;
  onCollapse: () => void;
}

const TABS: Array<{ id: PreviewPaneTab; label: string; icon: typeof Monitor }> = [
  { id: "preview", label: "Preview", icon: Monitor },
  { id: "config", label: "Config", icon: FileText },
];

/** Docked right-hand pane on wide screens: live terminal preview and the generated file. */
export function PreviewPane({ tab, onTabChange, onCollapse }: PreviewPaneProps) {
  const modifiedCount = useConfigStore((state) => Object.keys(state.config).length);

  return (
    <aside
      aria-label="Preview and generated config"
      className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-[42%] max-w-[680px] shrink-0 flex-col border-l border-border"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div role="tablist" aria-label="Pane view" className="flex gap-1 rounded-lg bg-muted/50 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              id={`preview-pane-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`preview-pane-panel-${id}`}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {id === "config" && modifiedCount > 0 && (
                <span className="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">{modifiedCount}</span>
              )}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCollapse} aria-label="Collapse preview pane">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div
        role="tabpanel"
        id={`preview-pane-panel-${tab}`}
        aria-labelledby={`preview-pane-tab-${tab}`}
        className={cn("min-h-0 flex-1", tab === "preview" ? "p-3" : "flex flex-col")}
      >
        {tab === "preview" ? (
          <GhosttyPreview isOpen docked onToggle={onCollapse} />
        ) : (
          <ConfigFileContent />
        )}
      </div>
    </aside>
  );
}
