import { ConfigValues } from "@/lib/store/config-store";

export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "starter" | "workflow" | "aesthetic" | "performance";
  config: ConfigValues;
  tags: string[];
}

export const presets: ConfigPreset[] = [
  // Starter Presets
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean defaults with just essential settings. Perfect starting point.",
    icon: "Minus",
    category: "starter",
    config: {
      "font-size": 14,
      "window-padding-x": 8,
      "window-padding-y": 8,
      "confirm-close-surface": false,
    },
    tags: ["beginner", "clean", "simple"],
  },
  {
    id: "comfortable",
    name: "Comfortable",
    description: "Relaxed spacing and readable fonts for long coding sessions.",
    icon: "Armchair",
    category: "starter",
    config: {
      "font-family": "JetBrains Mono",
      "font-size": 15,
      "window-padding-x": 16,
      "window-padding-y": 12,
      "cursor-style": "bar",
      "cursor-style-blink": true,
      "mouse-hide-while-typing": true,
    },
    tags: ["relaxed", "readable", "coding"],
  },

  // Workflow Presets
  {
    id: "poweruser",
    name: "Power User",
    description: "Optimized for keyboard-driven workflow with useful keybinds.",
    icon: "Zap",
    category: "workflow",
    config: {
      "font-family": "JetBrains Mono",
      "font-size": 13,
      "window-padding-x": 4,
      "window-padding-y": 4,
      "cursor-style": "block",
      "mouse-hide-while-typing": true,
      "copy-on-select": true,
      "confirm-close-surface": false,
      "scrollback-lines": 50000,
      "keybind": [
        "ctrl+shift+c=copy_to_clipboard",
        "ctrl+shift+v=paste_from_clipboard",
        "ctrl+shift+t=new_tab",
        "ctrl+shift+w=close_tab",
        "ctrl+plus=increase_font_size:1",
        "ctrl+minus=decrease_font_size:1",
        "ctrl+0=reset_font_size",
        "f11=toggle_fullscreen",
      ],
    },
    tags: ["productivity", "keyboard", "advanced"],
  },
  {
    id: "developer",
    name: "Developer",
    description: "Tailored for software development with git-friendly colors and ligatures.",
    icon: "Code",
    category: "workflow",
    config: {
      "font-family": "Fira Code",
      "font-size": 14,
      "font-feature": "calt,liga",
      "window-padding-x": 10,
      "window-padding-y": 8,
      "cursor-style": "bar",
      "cursor-style-blink": true,
      "shell-integration": "detect",
      "shell-integration-features": "cursor,sudo,title",
      "scrollback-lines": 100000,
      "mouse-hide-while-typing": true,
      "copy-on-select": true,
    },
    tags: ["coding", "programming", "ligatures"],
  },
  {
    id: "sysadmin",
    name: "System Admin",
    description: "High scrollback, clear fonts, and visibility settings for server work.",
    icon: "Server",
    category: "workflow",
    config: {
      "font-family": "Source Code Pro",
      "font-size": 13,
      "window-padding-x": 4,
      "window-padding-y": 4,
      "cursor-style": "block",
      "cursor-style-blink": false,
      "scrollback-lines": 500000,
      "bold-is-bright": true,
      "mouse-hide-while-typing": false,
      "shell-integration": "detect",
    },
    tags: ["server", "ssh", "logs"],
  },

  // Aesthetic Presets
  {
    id: "retro",
    name: "Retro Terminal",
    description: "Classic CRT-style look with green phosphor colors.",
    icon: "Monitor",
    category: "aesthetic",
    config: {
      "font-family": "VT323",
      "font-size": 18,
      "background": "#0a0a0a",
      "foreground": "#33ff33",
      "cursor-color": "#33ff33",
      "cursor-style": "block",
      "cursor-style-blink": true,
      "window-padding-x": 20,
      "window-padding-y": 16,
      "background-opacity": 0.95,
    },
    tags: ["vintage", "crt", "green"],
  },
  {
    id: "modern-dark",
    name: "Modern Dark",
    description: "Sleek dark theme with subtle transparency and rounded aesthetics.",
    icon: "Moon",
    category: "aesthetic",
    config: {
      "font-family": "SF Mono",
      "font-size": 14,
      "background": "#1a1b26",
      "foreground": "#c0caf5",
      "cursor-color": "#c0caf5",
      "selection-background": "#364a82",
      "cursor-style": "bar",
      "cursor-style-blink": true,
      "window-padding-x": 16,
      "window-padding-y": 12,
      "background-opacity": 0.92,
      "unfocused-split-opacity": 0.7,
    },
    tags: ["dark", "elegant", "transparent"],
  },
  {
    id: "cozy-warm",
    name: "Cozy Warm",
    description: "Warm, eye-friendly colors perfect for evening coding.",
    icon: "Sun",
    category: "aesthetic",
    config: {
      "font-family": "Cascadia Code",
      "font-size": 15,
      "background": "#1f1d2e",
      "foreground": "#e0def4",
      "cursor-color": "#eb6f92",
      "selection-background": "#44415a",
      "cursor-style": "bar",
      "cursor-style-blink": true,
      "window-padding-x": 20,
      "window-padding-y": 16,
      "background-opacity": 0.95,
    },
    tags: ["warm", "cozy", "night"],
  },

  // Performance Presets
  {
    id: "performance",
    name: "Performance",
    description: "Minimal overhead settings for maximum speed and responsiveness.",
    icon: "Gauge",
    category: "performance",
    config: {
      "font-size": 13,
      "window-padding-x": 0,
      "window-padding-y": 0,
      "cursor-style": "block",
      "cursor-style-blink": false,
      "scrollback-lines": 10000,
      "background-opacity": 1,
      "unfocused-split-opacity": 1,
      "resize-overlay": "never",
      "mouse-hide-while-typing": true,
    },
    tags: ["fast", "efficient", "minimal"],
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Large, readable text perfect for screen sharing or demos.",
    icon: "Presentation",
    category: "performance",
    config: {
      "font-family": "Fira Code",
      "font-size": 20,
      "font-thicken": true,
      "window-padding-x": 24,
      "window-padding-y": 20,
      "cursor-style": "block",
      "cursor-style-blink": true,
      "background-opacity": 1,
    },
    tags: ["demo", "screenshare", "large"],
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
  { id: "aesthetic" as const, name: "Aesthetic", description: "Visual styles and themes" },
  { id: "performance" as const, name: "Performance", description: "Speed and efficiency" },
];
