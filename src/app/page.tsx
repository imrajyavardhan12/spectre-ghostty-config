import { Check, Ghost, Keyboard, TriangleAlert, Undo2 } from "lucide-react";
import { EditorMock } from "@/components/landing/EditorMock";
import { LandingFooter, LandingNav, OpenEditorButton } from "@/components/landing/LandingChrome";
import { Reveal, TypeLines } from "@/components/landing/motion";
import { VersionChips } from "@/components/landing/VersionChips";
import { GHOSTTY_COMPATIBILITY_VERSION, GHOSTTY_PUBLIC_OPTION_COUNT } from "@/lib/compatibility";

const FADE_UP = "animate-fade-up [animation-fill-mode:backwards] motion-reduce:animate-none";
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
    // overflow-x-clip keeps the decorative glow from widening the page on phones.
    <div className="min-h-screen overflow-x-clip bg-background">
      <LandingNav />

      <header className="px-6 pt-36 pb-16 text-center">
        <div className="mx-auto max-w-3xl space-y-7">
          <div className={FADE_UP}>
            <a
              href={`https://ghostty.org/docs/install/release-notes/${GHOSTTY_COMPATIBILITY_VERSION.replace(/\./g, "-")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Check className="h-3 w-3" />
              Ghostty {GHOSTTY_COMPATIBILITY_VERSION}
            </a>
          </div>
          <h1
            className={`${FADE_UP} text-4xl leading-[1.1] font-light tracking-tight sm:text-6xl`}
            style={{ animationDelay: "0.1s" }}
          >
            Configure Ghostty
            <br />
            <span className="font-medium">without the docs.</span>
          </h1>
          <p
            className={`${FADE_UP} mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground`}
            style={{ animationDelay: "0.2s" }}
          >
            Pick options visually, check them in a live preview, and export a config that matches
            the Ghostty you run.
          </p>
          <div className={FADE_UP} style={{ animationDelay: "0.3s" }}>
            <OpenEditorButton />
          </div>
        </div>
      </header>

      <section className="px-6 pb-8">
        <div className={`${FADE_UP} mx-auto max-w-5xl`} style={{ animationDelay: "0.45s" }}>
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
                  <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-300">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 animate-pulse" />
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

      <LandingFooter />
    </div>
  );
}
