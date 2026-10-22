import Link from "next/link";
import { Ghost, Keyboard, TriangleAlert, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorMock } from "@/components/landing/EditorMock";
import { LandingFooter, LandingNav, OpenEditorButton } from "@/components/landing/LandingChrome";
import { Reveal, TypeLines } from "@/components/landing/motion";
import { VersionChips } from "@/components/landing/VersionChips";
import { GHOSTTY_COMPATIBILITY_VERSION, GHOSTTY_PUBLIC_OPTION_COUNT } from "@/lib/compatibility";

const INTRO = "animate-intro motion-reduce:animate-none";
const PILL =
  "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground";

function FeatureRow({
  index,
  title,
  body,
  visual,
}: {
  index: string;
  title: string;
  body: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-8 border-t border-border py-14 md:grid-cols-2 md:gap-16">
      <Reveal className="max-w-md">
        <div className="mb-3 font-mono text-xs text-primary">{index}</div>
        <h3 className="mb-3 text-2xl font-light">{title}</h3>
        <p className="leading-relaxed text-muted-foreground">{body}</p>
      </Reveal>
      <Reveal delay={150}>{visual}</Reveal>
    </div>
  );
}

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

        <section className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <FeatureRow
              index="01"
              title="See it before you save it"
              body="A real Ghostty renderer sits next to your settings. Themes, fonts and cursor changes show up as you make them."
              visual={
                <div
                  aria-hidden="true"
                  className="rounded-xl border border-border bg-[#1a1b26] p-5 font-mono text-xs leading-6 text-[#c0caf5] transition-transform duration-300 hover:-translate-y-1"
                >
                  <TypeLines
                    lines={[
                      <span key="a" className="text-[#8089b3]"># theme = Tokyo Night</span>,
                      <span key="b"><span className="text-[#7aa2f7]">$</span> cargo test</span>,
                      <span key="c"><span className="text-[#9ece6a]">ok</span> 214 passed</span>,
                    ]}
                  />
                </div>
              }
            />
            <FeatureRow
              index="02"
              title="Know about keybind conflicts"
              body="Spectre flags shortcuts that collide with each other and notes the ones that shadow Ghostty's own defaults."
              visual={
                <div
                  aria-hidden="true"
                  className="space-y-3 rounded-xl border border-border p-5 text-sm transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <Keyboard className="h-4 w-4 text-muted-foreground" />
                    ctrl+shift+t → new_tab
                  </div>
                  <Reveal delay={600}>
                    <div className="flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-xs text-warning-foreground">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 animate-pulse motion-reduce:animate-none" />
                      Also bound to new_window. Ghostty uses the last one you define.
                    </div>
                  </Reveal>
                </div>
              }
            />
            <FeatureRow
              index="03"
              title="Made for the version you run"
              body={`All ${GHOSTTY_PUBLIC_OPTION_COUNT} documented options, labeled with the release they arrived in. Pick your version and the rest disappear.`}
              visual={<VersionChips />}
            />
            <FeatureRow
              index="04"
              title="Safe to experiment"
              body="Undo every change, review a config before importing it, and share a link that shows you what it skipped."
              visual={
                <div
                  aria-hidden="true"
                  className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className={`group ${PILL}`}>
                    <Undo2 className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" />
                    Undo
                  </span>
                  <span className={PILL}>Review import</span>
                  <span className={PILL}>Share link</span>
                </div>
              }
            />
          </div>
        </section>

        <section className="border-t border-border px-6 py-24 text-center">
          <Reveal>
            <Ghost className="mx-auto mb-6 h-10 w-10 animate-float text-primary transition-transform duration-150 hover:rotate-12" />
            <h2 className="mb-6 text-3xl font-light">Ten presets to start from, or start blank.</h2>
            <OpenEditorButton />
          </Reveal>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
