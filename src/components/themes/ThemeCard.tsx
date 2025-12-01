"use client";

import { useState, useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Theme, categorizeTheme } from "@/lib/utils/themes";

interface ThemeCardProps {
  theme: Theme;
  isActive?: boolean;
  onApply: (theme: Theme) => void;
}

export function ThemeCard({ theme, isActive, onApply }: ThemeCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const isDark = categorizeTheme(theme) === "dark";
  const { background, foreground, palette } = theme.colors;

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

  const handleApply = async () => {
    setIsApplying(true);
    await new Promise((r) => setTimeout(r, 300));
    onApply(theme);
    setIsApplying(false);
  };

  // Get 8 main colors from palette for preview
  const previewColors = palette.slice(0, 8).filter(Boolean);

  return (
    <div style={{ perspective: "800px" }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all duration-300",
          isActive
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-primary/30"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
          transition: isHovering
            ? "transform 0.1s ease-out"
            : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Terminal Preview */}
        <div
          className="p-4"
          style={{ backgroundColor: background, color: foreground }}
        >
          {/* Fake terminal header */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>

          {/* Fake terminal content */}
          <div className="font-mono text-xs space-y-1">
            <div className="flex">
              <span style={{ color: palette[2] || "#4ec9b0" }}>~</span>
              <span className="mx-1" style={{ color: foreground }}>
                $
              </span>
              <span style={{ color: palette[4] || "#569cd6" }}>echo</span>
              <span className="ml-1" style={{ color: palette[3] || "#ce9178" }}>
                &quot;Hello, Ghostty!&quot;
              </span>
            </div>
            <div style={{ color: foreground }}>Hello, Ghostty!</div>
            <div className="flex">
              <span style={{ color: palette[2] || "#4ec9b0" }}>~</span>
              <span className="mx-1" style={{ color: foreground }}>
                $
              </span>
              <span
                className="inline-block w-2 h-3.5 animate-pulse"
                style={{ backgroundColor: theme.colors.cursorColor || foreground }}
              />
            </div>
          </div>
        </div>

        {/* Color palette strip */}
        <div className="flex h-2">
          {previewColors.length > 0
            ? previewColors.map((color, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))
            : Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{
                      backgroundColor: `hsl(${i * 45}, 70%, 50%)`,
                    }}
                  />
                ))}
        </div>

        {/* Info and action */}
        <div className="p-3 bg-card flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm truncate">{theme.name}</h3>
            <p className="text-xs text-muted-foreground">
              {isDark ? "Dark" : "Light"} theme
            </p>
          </div>

          <Button
            size="sm"
            variant={isActive ? "secondary" : "default"}
            onClick={handleApply}
            disabled={isApplying}
            className="gap-1.5"
          >
            {isApplying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isActive ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Applied
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for theme card
export function ThemeCardSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="h-28 bg-muted" />
      <div className="flex h-2">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex-1 bg-muted" />
          ))}
      </div>
      <div className="p-3 bg-card flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
        <div className="h-8 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}
