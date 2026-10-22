"use client";

import { RefreshCw } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { UtilityActions } from "@/components/layout/UtilityActions";
import { UtilityPage } from "@/components/layout/UtilityPage";
import { Button } from "@/components/ui/button";

const REPORT_URL = "https://github.com/imrajyavardhan12/spectre-ghostty-config/issues/new?template=bug_report.yml";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <UtilityPage
        command="spectre"
        output="panic: unexpected error while rendering"
        tone="error"
        code="Error"
        title="Something went wrong"
        actions={
          <>
            <Button size="lg" className="px-3.5 text-sm" onClick={reset}>
              <RefreshCw className="size-[15px]" aria-hidden="true" />
              Try again
            </Button>
            <UtilityActions editorSecondary />
          </>
        }
        footer={
          error.digest ? (
            <>
              Error ID <span className="font-mono">{error.digest}</span> ·{" "}
              <a
                href={`${REPORT_URL}&title=${encodeURIComponent(`Error ${error.digest}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Report on GitHub
              </a>
            </>
          ) : (
            <a href={REPORT_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              Report on GitHub
            </a>
          )
        }
      >
        Spectre hit an unexpected error. Your settings are stored in this browser and should still be there after a
        retry.
      </UtilityPage>
    </div>
  );
}
