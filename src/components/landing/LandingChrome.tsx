import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Code2, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPECTRE_VERSION } from "@/lib/version";

const GITHUB_URL = "https://github.com/imrajyavardhan12/spectre-ghostty-config";
const COFFEE_URL = "https://www.buymeacoffee.com/rvs12";

export function LandingNav() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 px-6 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <Ghost className="h-6 w-6 text-primary transition-transform duration-150 group-hover:rotate-12" />
          <span className="font-medium">Spectre</span>
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/themes" className="transition-colors hover:text-foreground">
            Themes
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Spectre on GitHub"
            className="transition-colors hover:text-foreground"
          >
            <Code2 className="h-5 w-5" />
          </a>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/editor">Open editor</Link>
          </Button>
        </div>
      </div>
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
    <Button
      asChild
      size="lg"
      className="group h-12 rounded-full px-6 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <Link href="/editor">
        Open the editor
        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </Button>
  );
}
