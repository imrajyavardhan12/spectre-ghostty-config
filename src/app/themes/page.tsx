"use client";

import { useState } from "react";
import Link from "next/link";
import { Ghost, Palette, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeBrowser } from "@/components/themes";
import { ConfigOutput } from "@/components/editor/ConfigOutput";
import { TerminalPreview, PreviewToggleButton } from "@/components/preview";

export default function ThemesPage() {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - consistent with editor */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Ghost className="h-6 w-6 text-primary transition-transform duration-150 group-hover:rotate-12" />
              <span className="font-medium">Spectre</span>
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="font-medium">Themes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <a
                href="https://github.com/imrajyavardhan12/spectre-ghostty-config"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild>
              <Link href="/editor">
                Open Editor
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content - consistent padding */}
      <main className="container px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Theme Browser</h1>
              <p className="text-muted-foreground">
                Browse 200+ color themes from iTerm2 Color Schemes
              </p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground max-w-2xl">
            Click on any theme to apply it to your configuration. The colors will be 
            automatically added to your config, and you can continue customizing in 
            the editor.
          </p>
        </div>

        {/* Theme browser */}
        <ThemeBrowser />

        {/* Attribution */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Themes sourced from{" "}
            <a
              href="https://github.com/mbadolato/iTerm2-Color-Schemes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              iTerm2-Color-Schemes
            </a>
            . Thank you to all contributors!
          </p>
        </div>
      </main>

      {/* Terminal Preview */}
      <TerminalPreview
        isOpen={previewOpen}
        onToggle={() => setPreviewOpen(false)}
      />

      {/* Floating buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <PreviewToggleButton
          isOpen={previewOpen}
          onToggle={() => setPreviewOpen(!previewOpen)}
        />
        <ConfigOutput />
      </div>
    </div>
  );
}
