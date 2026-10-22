import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code2, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPECTRE_VERSION } from "@/lib/version";

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

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <Ghost className="h-4 w-4" />
          <span>Spectre v{SPECTRE_VERSION}</span>
          <span className="opacity-50">·</span>
          <span>MIT License</span>
        </div>
        <div className="flex items-center gap-6">
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
          <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              width={96}
              height={27}
              unoptimized
            />
          </a>
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
