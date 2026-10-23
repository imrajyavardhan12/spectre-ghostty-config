import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditorMock } from "@/components/landing/EditorMock";
import { FeatureRow } from "@/components/landing/FeatureRow";
import { FontSizeDemo } from "@/components/landing/FontSizeDemo";
import { KeybindCard } from "@/components/landing/KeybindCard";
import { ClosingCta, LandingFooter, LandingNav, OpenEditorButton } from "@/components/landing/LandingChrome";
import { SafetyCards } from "@/components/landing/SafetyCards";
import { VersionTargeting } from "@/components/landing/VersionTargeting";
import { GHOSTTY_COMPATIBILITY_VERSION, GHOSTTY_PUBLIC_OPTION_COUNT } from "@/lib/compatibility";

const INTRO = "animate-intro motion-reduce:animate-none";

export default function HomePage() {
  return (
    // overflow-x-clip keeps the tilting mock from widening the page.
    <div className="min-h-screen overflow-x-clip bg-background">
      <header>
        <LandingNav />
      </header>

      <main className="animate-none">

        <section className="mx-auto max-w-[1200px] px-5 pt-9 md:px-8 md:pt-14 lg:pt-[72px]">
          <div className="grid items-end gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <a
                href={`https://ghostty.org/docs/install/release-notes/${GHOSTTY_COMPATIBILITY_VERSION.replace(/\./g, "-")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${INTRO} inline-flex h-7 items-center gap-2 rounded-full border border-border bg-card pr-[11px] pl-[9px] text-xs text-muted-foreground transition-colors hover:text-foreground`}
                style={{ animationDuration: "0.7s" }}
              >
                <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                Targets <span className="font-mono text-foreground">Ghostty {GHOSTTY_COMPATIBILITY_VERSION}</span>
              </a>
              <h1
                className={`${INTRO} mt-[22px] text-[40px] leading-[1.02] font-semibold tracking-[-0.04em] text-balance md:text-[60px] lg:text-[72px]`}
                style={{ animationDelay: "80ms" }}
              >
                Configure Ghostty
                <br />
                <span className="text-muted-foreground">without the docs.</span>
              </h1>
            </div>
            <div className={`${INTRO} flex flex-col gap-6 pb-1.5`} style={{ animationDelay: "180ms" }}>
              <p className="text-base leading-[1.55] text-pretty text-muted-foreground sm:text-lg">
                Pick options visually, check them in a live Ghostty preview, and export a config that
                matches the version you run.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <OpenEditorButton />
              <Button asChild variant="outline" size="lg" className="h-11 rounded-[10px] px-4 text-[15px]">
                  <Link href="/themes">Browse themes</Link>
                </Button>
              </div>
              <div className="text-[13px] text-subtle-foreground">Free and open source · MIT · No account</div>
            </div>
          </div>

          <div className={`${INTRO} mt-11 lg:mt-16`} style={{ animationDelay: "320ms", animationDuration: "1s" }}>
            <EditorMock />
          </div>
        </section>

        <section className="mx-auto flex max-w-[1200px] flex-col px-5 pt-6 md:px-8 md:pt-[72px] lg:pt-[104px]">
          <FeatureRow
            label="01 — Live preview"
            title="See it before you save it."
            body="A real Ghostty engine runs next to your settings in the browser. Themes, fonts and cursor changes show up as you make them."
          >
            <FontSizeDemo />
          </FeatureRow>
          <FeatureRow
            label="02 — Keybinds"
            title="Know which shortcuts do nothing."
            body="Spectre flags bindings that have no effect because a later row takes the same trigger, and notes the ones that replace a Ghostty default."
            flip
          >
            <KeybindCard />
          </FeatureRow>
          <FeatureRow
            label="03 — Version targeting"
            title="Made for the version you run."
            body={`All ${GHOSTTY_PUBLIC_OPTION_COUNT} documented options, labeled with the release they arrived in. Pick your version and hide the rest.`}
          >
            <VersionTargeting />
          </FeatureRow>
          <FeatureRow
            label="04 — Safe to experiment"
            title="Undo anything. Check before you import."
            body="Every change can be undone. Imported configs are reviewed line by line before they apply, and share links tell you which settings they skipped."
            flip
          >
            <SafetyCards />
          </FeatureRow>
        </section>

        <ClosingCta />
      </main>

      <LandingFooter />
    </div>
  );
}
