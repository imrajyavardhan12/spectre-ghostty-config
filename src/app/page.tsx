"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Ghost,
  ArrowRight,
  Palette,
  Type,
  Keyboard,
  Download,
  Github,
  Eye,
  Share2,
  Command,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Ghost className="h-6 w-6 text-primary transition-transform duration-150 group-hover:rotate-12" />
            <span className="font-medium">Spectre</span>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://www.buymeacoffee.com/rvs12"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                alt="Buy Me A Coffee"
                className="h-8"
              />
            </a>
            <a
              href="https://github.com/imrajyavardhan12/spectre-ghostty-config"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero - Asymmetric Layout */}
      <section className="min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text */}
            <div className="space-y-8 animate-fade-up">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Command className="h-4 w-4" />
                <span>Configuration made visual</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1]">
                Craft your
                <br />
                <span className="font-medium">Ghostty</span>
                <br />
                experience
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                An elegant interface for configuring your terminal. 
                No more hunting through documentation.
              </p>

              <div className="flex items-center gap-4 pt-4">
                <Button asChild size="lg" className="h-12 px-6 rounded-full">
                  <Link href="/editor">
                    Open Editor
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <a
                  href="https://ghostty.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  What is Ghostty?
                </a>
              </div>
            </div>

            {/* Right - Terminal Mockup */}
            <TerminalMockup />
          </div>
        </div>
      </section>

      {/* Features - Bento-style Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-xl">
            <h2 className="text-3xl font-light mb-4">
              Everything you need,
              <br />
              <span className="font-medium">nothing you don&apos;t</span>
            </h2>
            <p className="text-muted-foreground">
              100+ configuration options organized in a way that makes sense.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large card */}
            <LargeFeatureCard />

            {/* Small cards */}
            <FeatureCard
              icon={<Type className="h-5 w-5" />}
              title="Typography"
              description="Font family, size, weight, and OpenType features"
            />
            <FeatureCard
              icon={<Keyboard className="h-5 w-5" />}
              title="Keybindings"
              description="Visual editor for custom keyboard shortcuts"
            />
            <FeatureCard
              icon={<Eye className="h-5 w-5" />}
              title="Live Preview"
              description="See your changes before applying"
            />
            <FeatureCard
              icon={<Download className="h-5 w-5" />}
              title="Export"
              description="One-click download of your config file"
            />
            <FeatureCard
              icon={<Share2 className="h-5 w-5" />}
              title="Share"
              description="Generate shareable URLs for your setup"
              badge="Soon"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <Ghost className="h-12 w-12 text-primary mx-auto mb-8 transition-transform duration-150 hover:rotate-12" />
          <h2 className="text-3xl sm:text-4xl font-light mb-4">
            Ready to start?
          </h2>
          <p className="text-muted-foreground mb-8">
            Your perfect terminal setup is just a few clicks away.
          </p>
          <Button asChild size="lg" className="h-12 px-8 rounded-full">
            <Link href="/editor">
              Open Editor
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground group cursor-default">
            <Ghost className="h-4 w-4 transition-transform duration-150 group-hover:rotate-12" />
            <span>Spectre</span>
            <span className="opacity-50">·</span>
            <span>MIT License</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CodeLine({ 
  label, 
  value, 
  type = "string",
  delay = 0,
}: { 
  label: string; 
  value: string; 
  type?: "string" | "number" | "keyword";
  delay?: number;
}) {
  const valueColor = {
    string: "text-primary",
    number: "text-muted-foreground",
    keyword: "text-foreground",
  }[type];

  return (
    <div 
      className="flex animate-fade-up [animation-fill-mode:backwards] hover:translate-x-1 transition-transform"
      style={{ animationDelay: `${0.3 + delay * 0.08}s` }}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-muted-foreground/50 mx-2">=</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateY = (mouseX / (rect.width / 2)) * 5;
    const rotateX = -(mouseY / (rect.height / 2)) * 5;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div style={{ perspective: '800px' }}>
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors duration-300"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
          transition: isHovering ? 'transform 0.1s ease-out, border-color 0.3s' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s',
          boxShadow: isHovering 
            ? `0 15px 35px -10px rgba(0, 0, 0, 0.15), ${transform.rotateY * 1}px ${transform.rotateX * -1}px 20px -10px rgba(0, 0, 0, 0.1)`
            : '0 4px 20px -5px rgba(0, 0, 0, 0.05)'
        }}
      >
        {badge && (
          <span className="absolute top-4 right-4 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
        <div className="p-2.5 rounded-lg bg-muted w-fit mb-4 group-hover:bg-primary/10 transition-colors">
          <div className="text-primary">{icon}</div>
        </div>
        <h3 className="font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function LargeFeatureCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateY = (mouseX / (rect.width / 2)) * 4;
    const rotateX = -(mouseY / (rect.height / 2)) * 4;
    
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div className="md:col-span-2 md:row-span-2" style={{ perspective: '1000px' }}>
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        className="group h-full p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors duration-300"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
          transition: isHovering ? 'transform 0.1s ease-out, border-color 0.3s' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s',
          boxShadow: isHovering 
            ? `0 20px 40px -15px rgba(0, 0, 0, 0.2), ${transform.rotateY * 1.5}px ${transform.rotateX * -1.5}px 25px -10px rgba(0, 0, 0, 0.1)`
            : '0 4px 20px -5px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-start justify-between mb-auto">
            <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <Sparkles className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/50 group-hover:rotate-12 transition-all" />
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-medium mb-2">Color Themes</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Browse 200+ curated themes from iTerm2 Color Schemes or build 
              your own with our visual palette editor. See changes in real-time.
            </p>
          </div>
          {/* Preview */}
          <div className="mt-6 flex gap-2">
            {['#2d2a2e', '#f85e84', '#9ecd6f', '#e5c463', '#7aa2f7', '#ab9df2'].map((color, i) => (
              <div 
                key={i}
                className="w-8 h-8 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg cursor-pointer hover:!scale-125"
                style={{ backgroundColor: color, transitionDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
          {/* Browse themes link */}
          <Link 
            href="/themes" 
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Browse all themes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function TerminalMockup() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateY = (mouseX / (rect.width / 2)) * 8;
    const rotateX = -(mouseY / (rect.height / 2)) * 8;
    
    setTransform({ rotateX, rotateY, scale: 1.02 });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div 
      className="relative animate-fade-up [animation-delay:0.2s] [animation-fill-mode:backwards]" 
      style={{ perspective: '1000px' }}
    >
      {/* Floating elements with animation */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      
      {/* Terminal */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/10 cursor-pointer"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
          transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isHovering 
            ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 
               ${transform.rotateY * 2}px ${transform.rotateX * -2}px 30px -10px rgba(0, 0, 0, 0.15)`
            : '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Glare effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovering ? 0.1 : 0,
            background: `radial-gradient(circle at ${50 + transform.rotateY * 3}% ${50 - transform.rotateX * 3}%, rgba(255,255,255,0.8) 0%, transparent 60%)`
          }}
        />
        
        {/* macOS Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex gap-2 group">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors cursor-pointer relative">
              <span className="absolute inset-0 flex items-center justify-center text-[8px] text-black/50 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors cursor-pointer relative">
              <span className="absolute inset-0 flex items-center justify-center text-[8px] text-black/50 opacity-0 group-hover:opacity-100 transition-opacity">−</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors cursor-pointer relative">
              <span className="absolute inset-0 flex items-center justify-center text-[8px] text-black/50 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
            </div>
          </div>
          <span className="flex-1 text-center text-xs text-muted-foreground font-mono">
            ~/.config/ghostty/config
          </span>
        </div>
        
        {/* Code content with staggered animation */}
        <div className="p-6 font-mono text-sm space-y-1.5 bg-gradient-to-b from-card to-muted/20">
          <CodeLine label="font-family" value='"JetBrains Mono"' delay={0} />
          <CodeLine label="font-size" value="14" type="number" delay={1} />
          <CodeLine label="theme" value='"rose-pine"' delay={2} />
          <CodeLine label="cursor-style" value="block" type="keyword" delay={3} />
          <CodeLine label="background-opacity" value="0.95" type="number" delay={4} />
          <CodeLine label="window-padding-x" value="16" type="number" delay={5} />
          <div className="flex items-center text-muted-foreground pt-2 animate-fade-up [animation-fill-mode:backwards]" style={{ animationDelay: '0.8s' }}>
            <span className="opacity-50"># more options...</span>
            <span className="ml-1 w-2 h-4 bg-primary/70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
