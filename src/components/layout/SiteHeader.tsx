import Link from "next/link";
import { Code2, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SiteHeaderProps {
  /** The page name shown after the logo, such as "Themes". */
  crumb?: string;
  /** Replaces the plain link to the editor, for a page that must load something first. */
  onOpenEditor?: () => void;
}

/** The slim header for the pages around the editor. */
export function SiteHeader({ crumb, onOpenEditor }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2.5 px-4 sm:px-8">
        <Link
          href="/"
          aria-label="Spectre home"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Ghost className="size-5 text-primary" aria-hidden="true" />
          <span className="text-[15px] font-semibold max-[359px]:sr-only">Spectre</span>
        </Link>
        {crumb && (
          <>
            <span aria-hidden="true" className="text-border-strong">/</span>
            <span className="text-sm text-muted-foreground">{crumb}</span>
          </>
        )}
        <span className="flex-1" />
        <Button variant="ghost" size="icon-lg" asChild className="max-[359px]:hidden">
          <a
            href="https://github.com/imrajyavardhan12/spectre-ghostty-config"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Spectre on GitHub"
          >
            <Code2 className="size-[17px]" />
          </a>
        </Button>
        {onOpenEditor ? (
          <Button onClick={onOpenEditor} className="bg-foreground text-background hover:bg-foreground/90">
            Open editor
          </Button>
        ) : (
          <Button asChild className="bg-foreground text-background hover:bg-foreground/90">
            <Link href="/editor">Open editor</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
