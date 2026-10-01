"use client";

import { useEffect, useState } from "react";
import { Tilt } from "./motion";

// Hand-made sample themes for the mock; they are not read from the theme data.
const MOCK_THEMES = [
  { name: "Rosé Pine", bg: "#191724", fg: "#e0def4", dim: "#8b87a3", c: ["#eb6f92", "#9ccfd8", "#f6c177", "#c4a7e7"], p: ["#eb6f92", "#f6c177", "#9ccfd8", "#c4a7e7", "#31748f", "#ebbcba"] },
  { name: "Tokyo Night", bg: "#1a1b26", fg: "#c0caf5", dim: "#8089b3", c: ["#f7768e", "#9ece6a", "#e0af68", "#7aa2f7"], p: ["#f7768e", "#e0af68", "#9ece6a", "#7aa2f7", "#bb9af7", "#7dcfff"] },
  { name: "Catppuccin Mocha", bg: "#1e1e2e", fg: "#cdd6f4", dim: "#9399b2", c: ["#f38ba8", "#a6e3a1", "#f9e2af", "#89b4fa"], p: ["#f38ba8", "#fab387", "#f9e2af", "#a6e3a1", "#89b4fa", "#cba6f7"] },
] as const;

const CATEGORIES = ["Fonts", "Colors", "Window", "Cursor", "Keybinds", "Shell"];
const INTRO = "animate-fade-up [animation-fill-mode:backwards] motion-reduce:animate-none";

function SettingRow({ label, value, animateKey }: { label: string; value: string; animateKey?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span
        key={animateKey}
        className={`rounded-md bg-muted px-3 py-1 text-xs ${animateKey ? "animate-fade-in motion-reduce:animate-none" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * A decorative picture of the editor. It cycles themes on its own so the preview
 * visibly follows the settings, and pauses while hovered.
 */
export function EditorMock() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const theme = MOCK_THEMES[index];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % MOCK_THEMES.length), 4000);
    return () => clearInterval(id);
  }, [paused]);

  const terminal = [
    <div key="a" style={{ color: theme.dim }}>~/code <span style={{ color: theme.c[3] }}>main</span></div>,
    <div key="b"><span style={{ color: theme.c[1] }}>$</span> ls</div>,
    <div key="c"><span style={{ color: theme.c[3] }}>src</span> <span style={{ color: theme.c[3] }}>public</span> <span style={{ color: theme.c[2] }}>package.json</span></div>,
    <div key="d"><span style={{ color: theme.c[1] }}>$</span> git status</div>,
    <div key="e"><span style={{ color: theme.c[1] }}>✓</span> working tree clean<span className="ml-1 inline-block h-3.5 w-2 translate-y-0.5 animate-pulse" style={{ background: theme.fg }} /></div>,
  ];

  return (
    <div
      aria-hidden="true"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 animate-pulse rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 animate-pulse rounded-full bg-primary/10 blur-3xl [animation-delay:1s]" />
      <Tilt>
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="flex-1 text-center text-xs text-muted-foreground">Spectre — editor</span>
          </div>
          <div className="grid min-h-[340px] text-sm md:grid-cols-[150px_1fr_1fr]">
            <ul className="hidden space-y-1 border-r border-border p-3 md:block">
              {CATEGORIES.map((category, i) => (
                <li
                  key={category}
                  className={`${INTRO} rounded-md px-3 py-1.5 ${i === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                  style={{ animationDelay: `${0.5 + i * 0.06}s` }}
                >
                  {category}
                </li>
              ))}
            </ul>
            <div className="space-y-5 border-border p-5 md:border-r">
              <div className={INTRO} style={{ animationDelay: "0.6s" }}>
                <SettingRow label="theme" value={theme.name} animateKey={theme.name} />
              </div>
              <div className={INTRO} style={{ animationDelay: "0.7s" }}>
                <SettingRow label="background-opacity" value="0.95" />
              </div>
              <div className={INTRO} style={{ animationDelay: "0.8s" }}>
                <SettingRow label="cursor-style" value="block" />
              </div>
              <div className={INTRO} style={{ animationDelay: "0.9s" }}>
                <div className="mb-2 text-xs text-muted-foreground">palette</div>
                <div className="flex gap-1.5">
                  {theme.p.map((color, i) => (
                    <span
                      key={`${theme.name}-${color}`}
                      className="h-6 w-6 animate-scale-in rounded-md transition-transform duration-200 [animation-fill-mode:backwards] hover:-rotate-6 hover:scale-125 motion-reduce:animate-none"
                      style={{ background: color, animationDelay: `${i * 0.05}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div
              className="p-5 font-mono text-xs leading-6 transition-colors duration-500"
              style={{ background: theme.bg, color: theme.fg }}
            >
              <div key={theme.name}>
                {terminal.map((line, i) => (
                  <div
                    key={i}
                    className="animate-fade-up [animation-fill-mode:backwards] motion-reduce:animate-none"
                    style={{ animationDelay: `${(index === 0 ? 0.9 : 0) + i * 0.1}s` }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Tilt>
    </div>
  );
}
