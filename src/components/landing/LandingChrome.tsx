import Link from "next/link";
import { ArrowRight, Code2, Coffee, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { presets } from "@/data/presets";
import { SPECTRE_VERSION } from "@/lib/version";
import { Reveal } from "./motion";

const GITHUB_URL = "https://github.com/imrajyavardhan12/spectre-ghostty-config";
const COFFEE_URL = "https://www.buymeacoffee.com/rvs12";

export function LandingNav() {
  return (
    <nav className="mx-auto flex h-16 max-w-[1200px] items-center gap-1 px-5 sm:px-8">
      <Link
        href="/"
        className="mr-auto flex items-center gap-[9px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Ghost className="size-5 text-primary" aria-hidden="true" />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">Spectre</span>
      </Link>
      <Button asChild variant="ghost" className="hidden h-9 px-3 text-sm sm:inline-flex">
        <Link href="/themes">Themes</Link>
      </Button>
      <Button asChild variant="ghost" className="hidden h-9 gap-[7px] px-3 text-sm sm:inline-flex">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <Code2 className="size-[15px]" aria-hidden="true" />
          GitHub
        </a>
      </Button>
      <Button asChild className="ml-2 h-9 bg-foreground px-3.5 text-sm text-background hover:bg-foreground/90">
        <Link href="/editor">Open editor</Link>
      </Button>
    </nav>
  );
}

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

/** The last nudge: the presets to start from, then the editor. */
export function ClosingCta() {
  const count = NUMBER_WORDS[presets.length] ?? String(presets.length);
  return (
    <Reveal className="border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-[22px] px-5 py-[72px] text-center md:px-8 md:py-28">
        <Ghost className="size-7 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance md:text-[40px] lg:text-5xl">
          {count} presets to start from,
          <br />
          <span className="text-muted-foreground">or start blank.</span>
        </h2>
        <ul role="list" className="flex max-w-[560px] flex-wrap justify-center gap-1.5">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="inline-flex h-7 items-center rounded-full border border-border px-[11px] text-[13px] text-muted-foreground"
            >
              {preset.name}
            </li>
          ))}
        </ul>
        <OpenEditorButton />
      </div>
    </Reveal>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3.5 px-5 pt-6 pb-7 text-[13px] text-muted-foreground sm:px-8">
        <div className="mr-auto flex items-center gap-2">
          <Ghost className="size-[15px] text-subtle-foreground" aria-hidden="true" />
          <span className="text-foreground">Spectre</span>
          <span className="font-mono text-xs">v{SPECTRE_VERSION}</span>
          <span aria-hidden="true">·</span>
          <span>MIT License</span>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href="https://ghostty.org/docs/config"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Ghostty docs
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Source
          </a>
          <Button asChild variant="outline" className="h-[30px] gap-1.5 rounded-[7px] px-2.5 text-xs">
            <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer">
              <Coffee className="size-[13px]" aria-hidden="true" />
              Buy me a coffee
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}

export function OpenEditorButton() {
  return (
    <Button asChild size="lg" className="group h-11 gap-2 rounded-[10px] px-[18px] text-[15px]">
      <Link href="/editor">
        Open the editor
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </Button>
  );
}
