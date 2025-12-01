import Link from "next/link";
import {
  Ghost,
  ArrowRight,
  Palette,
  Type,
  Keyboard,
  Download,
  Github,
  Zap,
  Eye,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-3">
              <Ghost className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Spectre
              </h1>
            </div>

            <p className="max-w-2xl text-xl text-muted-foreground sm:text-2xl">
              A beautiful, modern configuration generator for{" "}
              <a
                href="https://ghostty.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Ghostty
              </a>{" "}
              terminal
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/editor">
                  Start Configuring
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="https://github.com/imrajyavardhan12/spectre-ghostty-config"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to customize Ghostty
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            An intuitive interface for all 100+ Ghostty configuration options
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Palette className="h-8 w-8" />}
            title="Color Themes"
            description="Choose from hundreds of pre-made themes or create your own custom color palette with our visual editor."
          />
          <FeatureCard
            icon={<Type className="h-8 w-8" />}
            title="Font Customization"
            description="Configure font families, sizes, styles, and advanced OpenType features with real-time preview."
          />
          <FeatureCard
            icon={<Keyboard className="h-8 w-8" />}
            title="Keybind Editor"
            description="Create and manage custom keybindings with an intuitive interface and action reference."
          />
          <FeatureCard
            icon={<Eye className="h-8 w-8" />}
            title="Live Preview"
            description="See your changes in real-time with our terminal preview (coming soon)."
          />
          <FeatureCard
            icon={<Download className="h-8 w-8" />}
            title="Easy Export"
            description="Export your configuration as a ready-to-use Ghostty config file with one click."
          />
          <FeatureCard
            icon={<Share2 className="h-8 w-8" />}
            title="Shareable Configs"
            description="Share your perfect configuration with others via URL (coming soon)."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div>
              <div className="text-4xl font-bold text-primary">100+</div>
              <div className="mt-2 text-muted-foreground">Config Options</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">13</div>
              <div className="mt-2 text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">200+</div>
              <div className="mt-2 text-muted-foreground">Color Themes</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to customize your terminal?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Create your perfect Ghostty configuration in minutes.
        </p>
        <div className="mt-10">
          <Button asChild size="lg" className="gap-2">
            <Link href="/editor">
              <Zap className="h-4 w-4" />
              Open Editor
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Ghost className="h-5 w-5" />
              <span className="font-semibold">Spectre</span>
              <span className="text-sm text-muted-foreground">
                Ghostty Config Generator
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a
                href="https://ghostty.org/docs/config"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Ghostty Docs
              </a>
              <a
                href="https://github.com/imrajyavardhan12/spectre-ghostty-config"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <span>MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="mb-2 text-primary">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
