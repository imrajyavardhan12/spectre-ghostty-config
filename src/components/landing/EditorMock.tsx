"use client";

import { useEffect, useState } from "react";
import {
  AppWindow,
  Download,
  Ghost,
  Keyboard,
  MousePointer2,
  Palette,
  Search,
  SquareTerminal,
  TextCursor,
  Type,
  Wrench,
} from "lucide-react";
import { GHOSTTY_PUBLIC_OPTION_COUNT } from "@/lib/compatibility";
import { SPECTRE_VERSION } from "@/lib/version";
import { Tilt, useReducedMotion } from "./motion";

// Hand-made sample themes for the mock; they are not read from the theme data.
// Palette order is ANSI 0-15: index 1 is red, 2 green, 3 yellow, 4 blue, 5 magenta.
const MOCK_THEMES = [
  { name: "Tokyo Night", bg: "#1a1b26", fg: "#c0caf5", pal: ["#15161e", "#f7768e", "#9ece6a", "#e0af68", "#7aa2f7", "#bb9af7", "#7dcfff", "#a9b1d6", "#414868", "#f7768e", "#9ece6a", "#e0af68", "#7aa2f7", "#bb9af7", "#7dcfff", "#c0caf5"] },
  { name: "Rose Pine", bg: "#191724", fg: "#e0def4", pal: ["#26233a", "#eb6f92", "#31748f", "#f6c177", "#9ccfd8", "#c4a7e7", "#ebbcba", "#e0def4", "#6e6a86", "#eb6f92", "#31748f", "#f6c177", "#9ccfd8", "#c4a7e7", "#ebbcba", "#e0def4"] },
  { name: "Catppuccin Mocha", bg: "#1e1e2e", fg: "#cdd6f4", pal: ["#45475a", "#f38ba8", "#a6e3a1", "#f9e2af", "#89b4fa", "#f5c2e7", "#94e2d5", "#bac2de", "#585b70", "#f38ba8", "#a6e3a1", "#f9e2af", "#89b4fa", "#f5c2e7", "#94e2d5", "#a6adc8"] },
  { name: "Gruvbox Dark", bg: "#282828", fg: "#ebdbb2", pal: ["#282828", "#cc241d", "#98971a", "#d79921", "#458588", "#b16286", "#689d6a", "#a89984", "#928374", "#fb4934", "#b8bb26", "#fabd2f", "#83a598", "#d3869b", "#8ec07c", "#ebdbb2"] },
  { name: "Rose Pine Dawn", bg: "#faf4ed", fg: "#575279", pal: ["#f2e9e1", "#b4637a", "#286983", "#ea9d34", "#56949f", "#907aa9", "#d7827e", "#575279", "#9893a5", "#b4637a", "#286983", "#ea9d34", "#56949f", "#907aa9", "#d7827e", "#575279"] },
] as const;

const CATEGORIES = [
  { name: "Fonts", icon: Type, modified: 1 },
  { name: "Colors", icon: Palette, modified: 2 },
  { name: "Window", icon: AppWindow, modified: 0 },
  { name: "Cursor", icon: TextCursor, modified: 0 },
  { name: "Mouse", icon: MousePointer2, modified: 0 },
  { name: "Keybinds", icon: Keyboard, modified: 0 },
  { name: "Shell", icon: SquareTerminal, modified: 0 },
  { name: "Advanced", icon: Wrench, modified: 0 },
];

const MODIFIED_TOTAL = CATEGORIES.reduce((total, category) => total + category.modified, 0);
const CYCLE_MS = 3200;
const COLOR_FADE = "transition-colors duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]";

function SettingRow({ title, option, modified, children, first }: { title: string; option: string; modified?: boolean; children: React.ReactNode; first?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3.5 py-3 ${first ? "" : "border-t border-border"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-medium">
          {title}
          {modified && <span className="size-[5px] rounded-full bg-primary" />}
        </div>
        <div className="font-mono text-[11px] text-subtle-foreground">{option}</div>
      </div>
      {children}
    </div>
  );
}

/**
 * A picture of the editor that cycles sample themes on its own, so the preview visibly follows the
 * settings. It pauses while hovered with a mouse, while focus is inside it, and under reduced motion. Only the theme dots are interactive.
 */
export function EditorMock() {
  const [index, setIndex] = useState(0);
  // Bumped on every pick, so choosing the theme that is already showing still restarts the wait.
  const [picks, setPicks] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const paused = hovered || focused || reducedMotion;
  const theme = MOCK_THEMES[index];
  const [, red, green, yellow, blue, magenta] = theme.pal;

  // A timeout keyed on the index and the picks, so choosing a theme by hand restarts the wait.
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % MOCK_THEMES.length), CYCLE_MS);
    return () => clearTimeout(id);
  }, [index, picks, paused]);

  return (
    <div
      onPointerEnter={(event) => setHovered(event.pointerType === "mouse")}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Tilt>
        <div className="overflow-hidden rounded-[14px] bg-card shadow-lg">
          <div aria-hidden="true" className="flex h-10 items-center gap-3 border-b border-border px-3.5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
              <span className="size-2.5 rounded-full bg-border-strong" />
            </div>
            <Ghost className="size-[15px] text-primary" />
            <div className="hidden h-[26px] w-60 items-center gap-[7px] rounded-md border border-border px-2 text-xs text-subtle-foreground sm:flex">
              <Search className="size-3" />
              Search {GHOSTTY_PUBLIC_OPTION_COUNT} options
              <span className="flex-1" />
              <span className="font-mono text-[10px]">⌘K</span>
            </div>
            <span className="flex-1" />
            <span className="flex h-[22px] items-center gap-1.5 rounded-full bg-accent px-2 text-[11px] font-medium text-accent-foreground">
              <span className="size-[5px] rounded-full bg-primary" />{MODIFIED_TOTAL} modified
            </span>
            <span className="flex h-[26px] items-center gap-[5px] rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground">
              <Download className="size-3" />
              Export
            </span>
          </div>

          <div className="grid h-[330px] grid-cols-1 md:h-[420px] md:grid-cols-2 lg:h-[470px] lg:grid-cols-[190px_minmax(0,1fr)_minmax(0,1.05fr)]">
            <div aria-hidden="true" className="hidden flex-col gap-0.5 border-r border-border px-2.5 py-3.5 lg:flex">
              {CATEGORIES.map(({ name, icon: Icon, modified }) => (
                <div
                  key={name}
                  className={`flex h-[30px] items-center gap-[9px] rounded-md px-2.5 text-[13px] ${name === "Colors" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                >
                  <Icon className="size-3.5" />
                  <span className="flex-1">{name}</span>
                  {modified > 0 && <span className="font-mono text-[10px] text-accent-foreground">{modified}</span>}
                </div>
              ))}
            </div>

            <div aria-hidden="true" className="hidden min-w-0 flex-col gap-3.5 p-[22px] md:flex">
              <div className="text-[17px] font-semibold tracking-[-0.01em]">Colors</div>
              <div className="rounded-[9px] border border-border">
                <SettingRow title="Theme" option="theme" modified first>
                  <div className="flex h-7 w-[150px] items-center gap-[7px] rounded-md border border-input bg-field px-2 text-xs">
                    <span className="flex h-[9px] w-7 overflow-hidden rounded-[2px]">
                      <span className={`flex-1 ${COLOR_FADE}`} style={{ backgroundColor: theme.bg }} />
                      <span className={`flex-1 ${COLOR_FADE}`} style={{ backgroundColor: red }} />
                      <span className={`flex-1 ${COLOR_FADE}`} style={{ backgroundColor: blue }} />
                    </span>
                    <span className="flex-1 overflow-hidden whitespace-nowrap">{theme.name}</span>
                  </div>
                </SettingRow>
                <SettingRow title="Background opacity" option="background-opacity">
                  <div className="flex w-[150px] items-center gap-2">
                    <div className="relative h-[3px] flex-1 rounded-full bg-muted">
                      <div className="absolute inset-y-0 left-0 right-[5%] rounded-full bg-primary" />
                      <div className="absolute top-1/2 left-[95%] -mt-1.5 -ml-1.5 size-3 rounded-full border-2 border-primary bg-switch-thumb" />
                    </div>
                    <span className="font-mono text-[11px]">0.95</span>
                  </div>
                </SettingRow>
                <SettingRow title="Cursor style" option="cursor-style" modified>
                  <div className="flex w-[150px] gap-0.5 rounded-md bg-muted p-0.5 font-mono text-[11px]">
                    <span className="grid h-[22px] flex-1 place-items-center text-muted-foreground">block</span>
                    <span className="grid h-[22px] flex-1 place-items-center rounded bg-card shadow-sm">bar</span>
                    <span className="grid h-[22px] flex-1 place-items-center text-muted-foreground">underline</span>
                  </div>
                </SettingRow>
              </div>
              <div className="flex flex-col gap-2.5 rounded-[9px] border border-border px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-[13px] font-medium">
                  Palette
                  <span className="font-mono text-[11px] font-normal text-subtle-foreground">palette</span>
                </div>
                <div className="grid grid-cols-8 gap-[5px]">
                  {theme.pal.map((color, i) => (
                    <span
                      key={i}
                      className="h-[22px] rounded shadow-[inset_0_0_0_1px_rgba(127,127,127,0.15)] transition-colors duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`flex min-w-0 flex-col overflow-hidden px-5 py-[18px] font-mono text-xs leading-[1.7] transition-[background-color,color] duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] sm:text-[13px]`}
              style={{ backgroundColor: theme.bg, color: theme.fg }}
            >
              <div aria-hidden="true" className="flex flex-1 flex-col">
                <div>
                  <span style={{ color: magenta }}>~/code/spectre</span> <span style={{ color: yellow }}>main</span>
                </div>
                <div>
                  <span style={{ color: green }}>❯</span> cargo test
                </div>
                <div className="opacity-60">{`   Compiling spectre v${SPECTRE_VERSION}`}</div>
                <div>
                  <span style={{ color: green }}>test result: ok.</span> 214 passed
                </div>
                <div className="h-[1.7em]" />
                <div>
                  <span style={{ color: green }}>❯</span> git status --short
                </div>
                <div>
                  <span style={{ color: red }}> M</span> config
                </div>
                <div>
                  <span style={{ color: blue }}>??</span> themes/
                </div>
                <div className="h-[1.7em]" />
                <div>
                  <span style={{ color: green }}>❯</span>{" "}
                  <span
                    className="inline-block h-[1.15em] w-0.5 animate-[blink_1.1s_steps(1)_infinite] align-[-0.2em] motion-reduce:animate-none"
                    style={{ backgroundColor: theme.fg }}
                  />
                </div>
                <div className="flex-1" />
              </div>
              <div className="flex items-center gap-2.5 text-[11px]">
                <span aria-hidden="true" className="opacity-70">theme = {theme.name}</span>
                <span className="flex-1" />
                <div role="group" aria-label="Sample theme" className="flex">
                  {MOCK_THEMES.map((option, i) => (
                    <button
                      key={option.name}
                      type="button"
                      aria-label={option.name}
                      aria-pressed={i === index}
                      onClick={() => {
                        setIndex(i);
                        setPicks((n) => n + 1);
                      }}
                      className="group grid size-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-current"
                    >
                      <span
                        className={`size-2 rounded-full bg-current transition-[opacity,transform] group-hover:opacity-80 ${i === index ? "scale-125" : ""}`}
                        style={{ opacity: i === index ? 0.95 : 0.55 }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tilt>
    </div>
  );
}
