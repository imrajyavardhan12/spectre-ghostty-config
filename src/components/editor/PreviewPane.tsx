"use client";

import { FileText, Monitor, PanelRightClose, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigActions, ConfigFileContent } from "@/components/editor/ConfigOutput";
import { GhosttyPreview } from "@/components/preview";
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";

export type PreviewPaneTab = "preview" | "config";

interface PreviewPaneProps {
  tab: PreviewPaneTab;
  onTabChange: (tab: PreviewPaneTab) => void;
  onCollapse: () => void;
}

interface PreviewPaneBodyProps extends PreviewPaneProps {
  /** Docked, the pane collapses to the floating buttons; in a sheet it closes. */
  inSheet?: boolean;
}

const TABS: Array<{ id: PreviewPaneTab; label: string; icon: typeof Monitor }> = [
  { id: "preview", label: "Preview", icon: Monitor },
  { id: "config", label: "Config", icon: FileText },
];

/** Docked right-hand pane on wide screens: live terminal preview and the generated file. */
export function PreviewPane(props: PreviewPaneProps) {
  return (
    <aside
      aria-label="Preview and generated config"
      className="sticky top-14 flex h-[calc(100dvh-3.5rem)] w-[42%] max-w-[680px] shrink-0 flex-col border-l border-border bg-background"
    >
      <PreviewPaneBody {...props} />
    </aside>
  );
}

/** The tab header and the panel under it. The docked pane and the narrow-screen sheet share it. */
export function PreviewPaneBody({ tab, onTabChange, onCollapse, inSheet = false }: PreviewPaneBodyProps) {
  const modifiedCount = useConfigStore((state) => Object.keys(state.config).length);
  const CloseIcon = inSheet ? X : PanelRightClose;

  return (
    <>
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border pr-2.5 pl-3.5 max-[359px]:gap-1 max-[359px]:pl-2.5 max-[359px]:pr-1.5">
        <div role="tablist" aria-label="Pane view" className="flex gap-0.5 rounded-lg bg-muted p-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`preview-pane-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`preview-pane-panel-${id}`}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex h-[30px] items-center gap-1.5 rounded-md px-3 max-[359px]:px-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                tab === id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 max-[359px]:hidden" aria-hidden="true" />
              {label}
              {id === "config" && modifiedCount > 0 && (
                <span className="font-mono text-[11px] font-medium text-accent-foreground">{modifiedCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {tab === "config" && <ConfigActions compact />}
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onCollapse}
          aria-label={inSheet ? "Close" : "Collapse preview pane"}
        >
          <CloseIcon className="size-4" />
        </Button>
      </div>

      <div
        role="tabpanel"
        id={`preview-pane-panel-${tab}`}
        aria-labelledby={`preview-pane-tab-${tab}`}
        className={cn("min-h-0 flex-1", tab === "preview" ? "p-3.5" : "flex flex-col")}
      >
        {tab === "preview" ? (
          <GhosttyPreview isOpen docked onToggle={onCollapse} onViewConfig={() => onTabChange("config")} />
        ) : (
          <ConfigFileContent showActions={false} />
        )}
      </div>
    </>
  );
}
