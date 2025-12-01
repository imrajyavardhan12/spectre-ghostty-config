import { ConfigCategory } from "@/lib/schema/types";

export const categories: ConfigCategory[] = [
  {
    id: "fonts",
    name: "Fonts",
    description: "Font family, size, styles, and variations",
    icon: "Type",
  },
  {
    id: "colors",
    name: "Colors",
    description: "Theme, palette, background, foreground, cursor colors",
    icon: "Palette",
  },
  {
    id: "window",
    name: "Window",
    description: "Window decorations, padding, sizing, titlebar",
    icon: "AppWindow",
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "Cursor style, color, and blinking behavior",
    icon: "MousePointer2",
  },
  {
    id: "mouse",
    name: "Mouse",
    description: "Mouse click behavior, scrolling, hiding",
    icon: "Mouse",
  },
  {
    id: "clipboard",
    name: "Clipboard",
    description: "Copy and paste behavior",
    icon: "Clipboard",
  },
  {
    id: "keybinds",
    name: "Keybinds",
    description: "Keyboard shortcuts and bindings",
    icon: "Keyboard",
  },
  {
    id: "shell",
    name: "Shell",
    description: "Shell integration, command, environment",
    icon: "Terminal",
  },
  {
    id: "application",
    name: "Application",
    description: "Startup, shutdown, notifications",
    icon: "Settings",
  },
  {
    id: "quick-terminal",
    name: "Quick Terminal",
    description: "Quick terminal dropdown settings",
    icon: "TerminalSquare",
  },
  {
    id: "macos",
    name: "macOS",
    description: "macOS-specific settings",
    icon: "Apple",
  },
  {
    id: "linux",
    name: "Linux",
    description: "Linux and GTK-specific settings",
    icon: "Monitor",
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Scrollback, shaders, image storage",
    icon: "Wrench",
  },
];
