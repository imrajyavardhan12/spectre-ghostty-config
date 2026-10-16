"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingRenderer } from "@/components/settings";
import { getOptionsByCategory } from "@/data/ghostty-options";
import { groupOptions, type OptionGroup } from "@/data/option-groups";
import { splitOptionsBySupport } from "@/lib/ghostty-versions";
import { useConfigStore } from "@/lib/store/config-store";
import { categories } from "@/data/categories";
import { Category } from "@/lib/schema/types";
import { cn } from "@/lib/utils";

interface ConfigPanelProps {
  category: Category;
  highlightedOption?: string | null;
}

export function ConfigPanel({ category, highlightedOption }: ConfigPanelProps) {
  // Radix wraps viewport content in a display:table div that grows to its
  // min-content width; block keeps options within narrow screens.
  return (
    <ScrollArea className="h-[calc(100vh-3.5rem)] [&_[data-slot=scroll-area-viewport]>div]:block!">
      <CategoryPage key={category} category={category} highlightedOption={highlightedOption} />
    </ScrollArea>
  );
}

function groupSectionId(category: Category, groupId: string): string {
  return `group-${category}-${groupId}`;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CategoryPage({ category, highlightedOption }: ConfigPanelProps) {
  const targetVersion = useConfigStore((state) => state.targetVersion);
  const hideUnsupported = useConfigStore((state) => state.hideUnsupported);
  const config = useConfigStore((state) => state.config);
  const allCategoryOptions = getOptionsByCategory(category);
  const { supported, unsupported } = splitOptionsBySupport(allCategoryOptions, targetVersion);
  const options = hideUnsupported ? supported : allCategoryOptions;
  const hiddenCount = hideUnsupported ? unsupported.length : 0;
  const categoryInfo = categories.find((c) => c.id === category);
  const groups = groupOptions(category, options);
  const modifiedCount = options.filter((option) => option.id in config).length;

  return (
    <div className="mx-auto max-w-3xl px-6 pt-8 pb-32">
      <header className="mb-6">
        <h1 className="text-h1">{categoryInfo?.name}</h1>
        {categoryInfo?.description && (
          <p className="mt-1 text-sm text-muted-foreground">{categoryInfo.description}</p>
        )}
        <p className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
          {options.length} {options.length === 1 ? "option" : "options"}
          {modifiedCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-accent-foreground">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {modifiedCount} modified
              </span>
            </>
          )}
        </p>
      </header>

      {/* The preview renders with browser fonts, so say so once, quietly. */}
      {category === "fonts" && (
        <p className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" aria-hidden="true" />
          The preview can only show fonts installed on this device. Ghostty&apos;s default is JetBrains Mono.
        </p>
      )}

      {hiddenCount > 0 && (
        <p role="status" className="mb-4 text-xs text-muted-foreground">
          {hiddenCount} {hiddenCount === 1 ? "option needs" : "options need"} a newer Ghostty than {targetVersion} and {hiddenCount === 1 ? "is" : "are"} hidden.
        </p>
      )}

      {groups.length > 1 ? (
        <GroupedOptions category={category} groups={groups} highlightedOption={highlightedOption} />
      ) : (
        groups.map((group) => (
          <OptionCard key={group.id} group={group} highlightedOption={highlightedOption} />
        ))
      )}

      {options.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {hiddenCount > 0
            ? `Every option here needs a newer Ghostty than ${targetVersion}.`
            : "No options available for this category."}
        </p>
      )}
    </div>
  );
}

function OptionCard({ group, highlightedOption }: { group: OptionGroup; highlightedOption?: string | null }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {group.options.map((option) => (
        <div
          id={`option-${option.id}`}
          key={option.id}
          className={cn(
            // Search jumps land just below the sticky group bar.
            "scroll-mt-20 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg",
            highlightedOption === option.id && "bg-accent/60 ring-2 ring-inset ring-primary"
          )}
        >
          <SettingRenderer option={option} />
        </div>
      ))}
    </div>
  );
}

interface GroupedOptionsProps {
  category: Category;
  groups: OptionGroup[];
  highlightedOption?: string | null;
}

/** Long categories: a sticky jump bar that follows scroll, then one headed card per group. */
function GroupedOptions({ category, groups, highlightedOption }: GroupedOptionsProps) {
  const config = useConfigStore((state) => state.config);
  const [activeGroup, setActiveGroup] = useState(groups[0].id);
  const barRef = useRef<HTMLElement>(null);
  const groupIds = groups.map((group) => group.id).join(" ");

  useEffect(() => {
    const bar = barRef.current;
    const viewport = bar?.closest<HTMLElement>("[data-slot=scroll-area-viewport]");
    if (!bar || !viewport) return;
    const ids = groupIds.split(" ");
    let shown = ids[0];

    const update = () => {
      let current = ids[0];
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2;
      if (atBottom) {
        current = ids[ids.length - 1];
      } else {
        const line = bar.getBoundingClientRect().bottom + 24;
        for (const id of ids) {
          const section = document.getElementById(groupSectionId(category, id));
          if (section && section.getBoundingClientRect().top <= line) current = id;
        }
      }
      if (current === shown) return;
      shown = current;
      setActiveGroup(current);
      // Keep the active chip visible when the bar scrolls sideways.
      bar
        .querySelector<HTMLElement>(`[data-group="${current}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    viewport.addEventListener("scroll", update, { passive: true });
    return () => viewport.removeEventListener("scroll", update);
  }, [category, groupIds]);

  const jumpTo = (groupId: string) => {
    setActiveGroup(groupId);
    document.getElementById(groupSectionId(category, groupId))?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <nav
        ref={barRef}
        aria-label="Groups"
        className="sticky top-0 z-10 -mx-6 mb-6 border-b border-border bg-background px-6 py-2"
      >
        {/* Scrolls sideways on narrow screens; the fade hints at more chips. */}
        <ul className="scrollbar-none flex gap-1 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]">
          {groups.map((group) => {
            const isActive = group.id === activeGroup;
            const modified = group.options.filter((option) => option.id in config).length;
            return (
              <li key={group.id} className="shrink-0">
                <button
                  type="button"
                  data-group={group.id}
                  onClick={() => jumpTo(group.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-colors md:h-7",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {group.name}
                  <span className={cn("font-mono text-[11px]", isActive ? "text-background/75" : "text-subtle-foreground")}>
                    {group.options.length}
                  </span>
                  {modified > 0 && (
                    <>
                      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                      <span className="sr-only">, {modified} modified</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-8">
        {groups.map((group) => {
          const headingId = `${groupSectionId(category, group.id)}-heading`;
          return (
            <section
              key={group.id}
              id={groupSectionId(category, group.id)}
              aria-labelledby={headingId}
              className="scroll-mt-16"
            >
              <h2 id={headingId} className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                {group.name}
                <span className="font-mono text-xs font-normal text-subtle-foreground">
                  {group.options.length}
                </span>
              </h2>
              <OptionCard group={group} highlightedOption={highlightedOption} />
            </section>
          );
        })}
      </div>
    </>
  );
}
