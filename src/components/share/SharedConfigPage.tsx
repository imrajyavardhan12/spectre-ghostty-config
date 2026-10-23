"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Clock, Copy, Download, Link2, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { UtilityActions } from "@/components/layout/UtilityActions";
import { UtilityPage } from "@/components/layout/UtilityPage";
import { ConfigListing } from "@/components/share/ConfigListing";
import { Button } from "@/components/ui/button";
import { getConfigFromUrl, summarizeDroppedSettings } from "@/lib/utils/url-share";
import { exportGhosttyConfig } from "@/lib/utils/config-export";
import { useConfigStore } from "@/lib/store/config-store";
import { getConfigOption } from "@/lib/utils/config-options";
import {
  getOptionIntroducedIn,
  isKnownGhosttyRelease,
  isOptionSupportedIn,
  shortGhosttyVersion,
} from "@/lib/ghostty-versions";
import { findSensitiveSettings } from "@/lib/security/sensitive-options";

const SENSITIVE_VALUE_PREVIEW_LENGTH = 160;

function previewValue(value: string): string {
  return value.length > SENSITIVE_VALUE_PREVIEW_LENGTH
    ? `${value.slice(0, SENSITIVE_VALUE_PREVIEW_LENGTH)}…`
    : value;
}

const NOTE_CLASS = "flex gap-2.5 rounded-[9px] border px-3.5 py-3 text-[13px] leading-normal";

function InvalidShareLink({ corrupted }: { corrupted: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <UtilityPage
        command={corrupted ? "open /share?c=…" : "open /share"}
        output={corrupted ? "error: share data could not be decoded" : "error: no share data in this link"}
        tone="error"
        code="Share link"
        title={corrupted ? "Invalid share link" : "No configuration in this link"}
        actions={<UtilityActions />}
      >
        {corrupted
          ? "This link is incomplete or was changed after it was made, so Spectre can’t read the config inside it. Ask for a fresh link, or start in the editor."
          : "This link doesn’t have a configuration attached. Ask for a fresh link, or start in the editor."}
      </UtilityPage>
    </div>
  );
}

function SharePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadConfig = useConfigStore((state) => state.loadConfig);
  const targetVersion = useConfigStore((state) => state.targetVersion);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const sharedConfig = useMemo(() => getConfigFromUrl(searchParams), [searchParams]);

  const configString = sharedConfig
    ? exportGhosttyConfig(sharedConfig.config, sharedConfig.theme, targetVersion)
    : "";
  const modifiedCount = sharedConfig ? Object.keys(sharedConfig.config).length : 0;
  const skipped = summarizeDroppedSettings(sharedConfig?.dropped ?? []);
  const skippedDetail = [
    skipped.names.join(", ") + (skipped.moreCount > 0 ? ` and ${skipped.moreCount} more` : ""),
    skipped.unrecognizedCount > 0
      ? `${skipped.unrecognizedCount} unrecognized ${skipped.unrecognizedCount === 1 ? "setting" : "settings"}`
      : "",
  ]
    .filter(Boolean)
    .join("; ");

  // Flags payload options newer than the viewer's target without dropping
  // them: the validated payload stays authoritative (trust boundary).
  const newerSharedOptions = useMemo(() => {
    if (!sharedConfig || !isKnownGhosttyRelease(targetVersion)) return [];
    return Object.keys(sharedConfig.config)
      .filter((key) => getConfigOption(key) && !isOptionSupportedIn(key, targetVersion))
      .sort();
  }, [sharedConfig, targetVersion]);
  const newerKeys = useMemo(
    () => new Map(newerSharedOptions.map((key) => [key, getOptionIntroducedIn(key)] as const)),
    [newerSharedOptions]
  );

  // Settings that run programs or weaken protections are surfaced up front,
  // since a shared config comes from someone else.
  const sensitiveSettings = useMemo(
    () => (sharedConfig ? findSensitiveSettings(sharedConfig.config) : []),
    [sharedConfig]
  );
  const runsPrograms = sensitiveSettings.some((setting) => setting.reason === "runs-program");
  const programKeys = useMemo(
    () => new Set(sensitiveSettings.filter((setting) => setting.reason === "runs-program").map((setting) => setting.key)),
    [sensitiveSettings]
  );

  if (!sharedConfig) {
    return <InvalidShareLink corrupted={Boolean(searchParams.get("c"))} />;
  }

  const handleCopy = async () => {
    clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(configString);
      setCopyState("copied");
      resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // Denied permission or an insecure context: say so rather than look like nothing happened.
      setCopyState("failed");
      resetTimer.current = setTimeout(() => setCopyState("idle"), 8000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([configString], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInEditor = () => {
    loadConfig(sharedConfig.config, sharedConfig.theme ?? undefined);
    router.push("/editor");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader crumb="Shared" onOpenEditor={handleOpenInEditor} />

      <main className="mx-auto flex w-full max-w-[800px] flex-1 flex-col gap-5 px-4 pt-7 pb-10 sm:px-8 md:pt-11 xl:pt-14">
        <div>
          <div className="flex items-center gap-[7px] text-[13px] text-muted-foreground">
            <Link2 className="size-3.5" aria-hidden="true" />
            Shared configuration · read-only
          </div>
          <h1 className="mt-2.5 text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] break-words sm:text-[32px]">
            {sharedConfig.theme ? <>Theme: {sharedConfig.theme}</> : <>Custom Configuration</>}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-sm text-muted-foreground">
            <span>
              {modifiedCount} {modifiedCount === 1 ? "setting" : "settings"}
            </span>
            <span aria-hidden="true" className="text-border-strong">·</span>
            <span>
              Target <span className="font-mono text-foreground">Ghostty {targetVersion}</span>
            </span>
          </div>
        </div>

        {(skipped.count > 0 || sensitiveSettings.length > 0 || newerSharedOptions.length > 0) && (
          <div className="flex flex-col gap-2">
            {skipped.count > 0 && (
              <div role="note" className={`${NOTE_CLASS} border-warning-border bg-warning-soft text-warning-foreground`}>
                <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong className="font-semibold">
                    {skipped.count} {skipped.count === 1 ? "setting" : "settings"} in this link {skipped.count === 1 ? "was" : "were"} invalid and skipped
                  </strong>
                  <div className="mt-[3px] font-mono break-words">{skippedDetail}</div>
                </div>
              </div>
            )}
            {sensitiveSettings.length > 0 && (
              <section
                aria-labelledby="sensitive-settings-heading"
                className={`${NOTE_CLASS} border-destructive-border bg-destructive-soft text-destructive-foreground`}
              >
                <ShieldAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h2 id="sensitive-settings-heading" className="font-semibold">
                    {runsPrograms
                      ? "This config runs programs or changes security settings"
                      : "This config changes security settings"}
                  </h2>
                  <p className="mt-[3px]">
                    Review these values before using a config from someone else, and only use it if you trust who sent the link.
                  </p>
                  <ul className="mt-2 space-y-1 font-mono text-xs break-all">
                    {sensitiveSettings.flatMap((setting) =>
                      setting.values.map((value, index) => (
                        <li key={`${setting.key}-${index}`}>
                          <span className="opacity-80">{setting.key} = </span>
                          <span>{previewValue(value)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </section>
            )}
            {newerSharedOptions.length > 0 && (
              <div role="note" className={`${NOTE_CLASS} border-border bg-card text-muted-foreground`}>
                <Clock className="mt-px size-4 shrink-0 text-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <strong className="font-semibold text-foreground">
                    {newerSharedOptions.length} {newerSharedOptions.length === 1 ? "setting" : "settings"} in this shared config {newerSharedOptions.length === 1 ? "requires" : "require"} Ghostty newer than {targetVersion}
                  </strong>
                  {Array.from(newerKeys, ([key, since]) => (
                    <div key={key} className="mt-[3px]">
                      <span className="font-mono">{key}</span> arrived in {shortGhosttyVersion(since)}. Older versions report it as unknown.
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="lg" className="px-3.5 text-sm" onClick={handleCopy}>
            {copyState === "copied" ? <Check className="size-[15px] text-accent-foreground" aria-hidden="true" /> : <Copy className="size-[15px]" aria-hidden="true" />}
            {copyState === "copied" ? "Copied" : "Copy config"}
          </Button>
          <Button variant="outline" size="lg" className="px-3.5 text-sm" onClick={handleDownload}>
            <Download className="size-[15px]" aria-hidden="true" />
            Download
          </Button>
          <Button size="lg" className="px-3.5 text-sm sm:ml-auto" onClick={handleOpenInEditor}>
            Open in editor
            <ArrowRight className="size-[15px]" aria-hidden="true" />
          </Button>
        </div>
        {/* Always mounted so screen readers announce a failure when it appears. */}
        <div role="status" className={copyState === "failed" ? "-mt-2 text-[13px] text-destructive-foreground" : "sr-only"}>
          {copyState === "failed" && "Couldn’t copy to the clipboard. Select the config below and copy it instead."}
          {copyState === "copied" && "Config copied to the clipboard"}
        </div>

        <ConfigListing config={configString} programKeys={programKeys} newerKeys={newerKeys} />

        <p className="text-[13px] text-muted-foreground">
          Save this file as <span className="font-mono text-foreground">~/.config/ghostty/config</span>, then reload Ghostty.
        </p>
      </main>
    </div>
  );
}

export default function SharedConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      }
    >
      <SharePageContent />
    </Suspense>
  );
}
