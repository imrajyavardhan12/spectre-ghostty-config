"use client";

import { useState } from "react";
import { EyeOff } from "lucide-react";
import {
  GHOSTTY_RELEASES,
  compareGhosttyVersions,
  getOptionIntroducedIn,
  shortGhosttyVersion,
} from "@/lib/ghostty-versions";

// One chip per minor release, standing for its newest patch, so a new Ghostty release adds a chip by itself.
const VERSIONS = Object.values(
  GHOSTTY_RELEASES.reduce<Record<string, string>>((byMinor, release) => {
    byMinor[release.split(".").slice(0, 2).join(".")] = release;
    return byMinor;
  }, {})
);
const SHOWN_OPTION = "key-remap";

const minor = (version: string) => version.split(".").slice(0, 2).join(".");

/** Version chips that hide the options newer than the one picked, using the same data as the editor. */
export function VersionTargeting() {
  const [target, setTarget] = useState(VERSIONS[VERSIONS.length - 1]);
  const introduced = getOptionIntroducedIn(SHOWN_OPTION);
  const hidden = compareGhosttyVersions(target, introduced) < 0;

  return (
    <div className="flex flex-col gap-3.5">
      <div role="radiogroup" aria-label="Ghostty version" className="flex flex-wrap gap-1.5">
        {VERSIONS.map((version) => (
          <label key={version} className="cursor-pointer">
            <input
              type="radio"
              name="landing-version"
              value={version}
              checked={version === target}
              onChange={() => setTarget(version)}
              className="peer sr-only"
            />
            <span className="inline-flex h-9 items-center rounded-full border border-border-strong px-3.5 font-mono text-[13px] font-medium text-muted-foreground transition-colors motion-reduce:transition-none peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
              Ghostty {minor(version)}
            </span>
          </label>
        ))}
      </div>
      <div className="rounded-[10px] border border-border bg-card">
        <Row title="Font size" option="font-size" />
        <Row title="Theme" option="theme" border />
        <Row title="Key remap" option={SHOWN_OPTION} border hidden={hidden}>
          <span className="inline-flex h-5 items-center gap-[5px] rounded-[5px] border border-border px-[7px] font-mono text-[11px] text-muted-foreground">
            {hidden && <EyeOff className="size-[11px]" aria-hidden="true" />}
            {shortGhosttyVersion(introduced)}+
          </span>
        </Row>
      </div>
      <div role="status" aria-label="Version support" className="text-[13px] text-muted-foreground">
        {hidden ? `Options newer than Ghostty ${minor(target)} are hidden.` : "Every option is shown."}
      </div>
    </div>
  );
}

function Row({ title, option, border, hidden, children }: { title: string; option: string; border?: boolean; hidden?: boolean; children?: React.ReactNode }) {
  return (
    <div data-hidden={hidden ? "true" : "false"} className={`flex items-center gap-2.5 px-3.5 py-[11px] transition-opacity duration-[250ms] motion-reduce:transition-none ${border ? "border-t border-border" : ""} ${hidden ? "opacity-40" : ""}`}>
      <span className={`flex-1 text-[13px] ${hidden ? "line-through" : ""}`}>
        {title} <span className="ml-1.5 font-mono text-xs text-subtle-foreground">{option}</span>
      </span>
      {children}
    </div>
  );
}
