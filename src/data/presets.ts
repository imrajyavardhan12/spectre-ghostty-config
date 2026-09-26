import type { ConfigValues } from "@/lib/schema/types";
import type { Platform } from "@/lib/schema/types";

export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "starter" | "workflow" | "aesthetic";
  /** Only non-default values; every one is checked against the Ghostty reference in CI. */
  config: ConfigValues;
  /** Font families that must be installed for the preset to look as intended. */
  fonts: string[];
  /** Platforms the preset fully applies to. Omit when every setting works everywhere. */
  platforms?: Platform[];
  tags: string[];
}

// Curated presets. See docs/PRESETS.md for the rules every preset must follow;
// src/data/presets.test.ts enforces them. Ghostty's embedded default font
// (JetBrains Mono) is used unless a preset declares otherwise.
export const presets: ConfigPreset[] = [
  // Starter
  {
    id: "minimal",
    name: "Minimal",
    description: "A little breathing room around the text, balanced padding, and a mouse cursor that hides while you type.",
    icon: "Minus",
    category: "starter",
    config: {
      "window-padding-x": "8",
      "window-padding-y": "6",
      "window-padding-balance": true,
      "mouse-hide-while-typing": true,
    },
    fonts: [],
    tags: ["beginner", "clean", "simple"],
  },
  {
    id: "comfortable",
    name: "Comfortable",
    description: "Larger text, taller lines, generous padding, and a steady bar cursor for long reading sessions.",
    icon: "Armchair",
    category: "starter",
    config: {
      "font-size": 15,
      "adjust-cell-height": "8%",
      "window-padding-x": "16",
      "window-padding-y": "12",
      "window-padding-balance": true,
      "cursor-style": "bar",
      "cursor-style-blink": "false",
      "mouse-hide-while-typing": true,
    },
    fonts: [],
    tags: ["relaxed", "readable", "coding"],
  },

  // Workflow
  {
    id: "leader-keys",
    name: "Leader Keys",
    description: "tmux-style splits and tabs behind a ctrl+a leader sequence. Press ctrl+a twice to send ctrl+a to the shell.",
    icon: "Zap",
    category: "workflow",
    config: {
      keybind: [
        "ctrl+a>v=new_split:right",
        "ctrl+a>s=new_split:down",
        "ctrl+a>h=goto_split:left",
        "ctrl+a>j=goto_split:down",
        "ctrl+a>k=goto_split:up",
        "ctrl+a>l=goto_split:right",
        "ctrl+a>z=toggle_split_zoom",
        "ctrl+a>e=equalize_splits",
        "ctrl+a>c=new_tab",
        "ctrl+a>n=next_tab",
        "ctrl+a>p=previous_tab",
        "ctrl+a>r=reload_config",
        "ctrl+a>ctrl+a=text:\\x01",
      ],
      "unfocused-split-opacity": 0.85,
    },
    fonts: [],
    tags: ["keyboard", "tmux", "splits", "productivity"],
  },
  {
    id: "developer",
    name: "Developer",
    description: "Selections copy to the system clipboard, right-click copies or pastes, sudo keeps shell integration, and scrollback grows to 50 MB per terminal.",
    icon: "Code",
    category: "workflow",
    config: {
      "copy-on-select": "clipboard",
      "right-click-action": "copy-or-paste",
      "shell-integration-features": "sudo",
      "scrollback-limit": 50_000_000,
      "cursor-style": "bar",
      "cursor-style-blink": "false",
      "mouse-hide-while-typing": true,
      "unfocused-split-opacity": 0.85,
    },
    fonts: [],
    tags: ["coding", "programming", "clipboard"],
  },
  {
    id: "server-logs",
    name: "Server & Logs",
    description: "100 MB of scrollback per terminal for long log sessions, bold text in bright colors, and a contrast floor so any program's colors stay readable.",
    icon: "Server",
    category: "workflow",
    config: {
      "scrollback-limit": 100_000_000,
      "bold-color": "bright",
      "minimum-contrast": 3,
      "mouse-hide-while-typing": true,
    },
    fonts: [],
    tags: ["server", "ssh", "logs", "readability"],
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Large text, wide padding, and a blinking cursor that's easy to follow when screen sharing or demoing.",
    icon: "Presentation",
    category: "workflow",
    config: {
      "font-size": 20,
      "window-padding-x": "24",
      "window-padding-y": "20",
      "window-padding-balance": true,
      "cursor-style-blink": "true",
      "mouse-hide-while-typing": true,
    },
    fonts: [],
    tags: ["demo", "screenshare", "large"],
  },

  // Aesthetic
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "Ghostty's built-in TokyoNight theme with a bar cursor, balanced padding, and slight transparency.",
    icon: "Moon",
    category: "aesthetic",
    config: {
      theme: "TokyoNight",
      "background-opacity": 0.95,
      "window-padding-x": "14",
      "window-padding-y": "10",
      "window-padding-balance": true,
      "cursor-style": "bar",
    },
    fonts: [],
    tags: ["dark", "theme", "transparent"],
  },
  {
    id: "rose-pine",
    name: "Rosé Pine",
    description: "Follows your system appearance: Rose Pine Dawn in light mode, Rose Pine in dark mode, both built into Ghostty.",
    icon: "Sun",
    category: "aesthetic",
    config: {
      theme: "light:Rose Pine Dawn,dark:Rose Pine",
      "window-padding-x": "16",
      "window-padding-y": "12",
      "window-padding-balance": true,
    },
    fonts: [],
    tags: ["light", "dark", "auto", "theme"],
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    description: "Follows your system appearance: Catppuccin Latte in light mode, Mocha in dark mode, both built into Ghostty.",
    icon: "Sparkles",
    category: "aesthetic",
    config: {
      theme: "light:Catppuccin Latte,dark:Catppuccin Mocha",
      "window-padding-x": "12",
      "window-padding-y": "10",
      "window-padding-balance": true,
      "cursor-style": "bar",
    },
    fonts: [],
    tags: ["light", "dark", "auto", "pastel", "theme"],
  },
  {
    id: "retro",
    name: "Retro CRT",
    description: "Green-phosphor look from Ghostty's built-in Retro theme with the VT323 pixel font and a blinking block cursor.",
    icon: "Monitor",
    category: "aesthetic",
    config: {
      theme: "Retro",
      "font-family": "VT323",
      "font-size": 18,
      "cursor-style-blink": "true",
      "window-padding-x": "20",
      "window-padding-y": "16",
    },
    fonts: ["VT323"],
    tags: ["vintage", "crt", "green", "pixel"],
  },
];

// Helper to get presets by category
export function getPresetsByCategory(category: ConfigPreset["category"]): ConfigPreset[] {
  return presets.filter(p => p.category === category);
}

// Helper to search presets
export function searchPresets(query: string): ConfigPreset[] {
  const lower = query.toLowerCase();
  return presets.filter(p =>
    p.name.toLowerCase().includes(lower) ||
    p.description.toLowerCase().includes(lower) ||
    p.tags.some(t => t.includes(lower))
  );
}

// Category metadata
export const presetCategories = [
  { id: "starter" as const, name: "Starter", description: "Great starting points" },
  { id: "workflow" as const, name: "Workflow", description: "Optimized for specific tasks" },
  { id: "aesthetic" as const, name: "Aesthetic", description: "Built-in Ghostty themes and visual styles" },
];
