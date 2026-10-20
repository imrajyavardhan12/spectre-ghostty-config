"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PreviewPaneBody, type PreviewPaneTab } from "@/components/editor/PreviewPane";
import { TABLET_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";

interface PreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: PreviewPaneTab;
  onTabChange: (tab: PreviewPaneTab) => void;
}

/** The preview pane below the wide breakpoint: a drawer from the right on tablets, a bottom sheet on phones. */
export function PreviewSheet({ open, onOpenChange, tab, onTabChange }: PreviewSheetProps) {
  const isTablet = useMediaQuery(TABLET_QUERY);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isTablet ? "right" : "bottom"}
        hideClose
        className={
          isTablet
            ? "w-full gap-0 p-0 sm:max-w-[460px]"
            : "top-[72px] h-auto gap-0 rounded-t-2xl p-0 data-[state=open]:duration-300"
        }
      >
        <SheetTitle className="sr-only">Preview and generated config</SheetTitle>
        <SheetDescription className="sr-only">
          A live terminal preview of your settings and the config file they produce.
        </SheetDescription>
        {!isTablet && (
          <div aria-hidden="true" className="flex justify-center pt-2 pb-0.5">
            <span className="h-1 w-9 rounded-full bg-border-strong" />
          </div>
        )}
        <PreviewPaneBody
          inSheet
          tab={tab}
          onTabChange={onTabChange}
          onCollapse={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
