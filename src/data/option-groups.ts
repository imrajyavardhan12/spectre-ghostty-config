import type { Category, ConfigOption } from "@/lib/schema/types";

export interface OptionGroupDefinition {
  id: string;
  name: string;
  /** Display order within the group. */
  optionIds: readonly string[];
}

export interface OptionGroup {
  id: string;
  name: string;
  options: ConfigOption[];
}

/**
 * How each category's options are grouped and ordered in the editor. Groups follow
 * how people think ("I want transparency") rather than key prefixes; platform-only
 * options sit with their topic. Categories with 8 or fewer options stay one group.
 * Every option belongs to exactly one group (see option-groups.test.ts).
 */
export const OPTION_GROUPS: Record<Category, readonly OptionGroupDefinition[]> = {
  fonts: [
    {
      id: "family-and-size",
      name: "Family & size",
      optionIds: [
        "font-family",
        "font-size",
        "font-style",
        "font-synthetic-style",
      ],
    },
    {
      id: "style-overrides",
      name: "Style overrides",
      optionIds: [
        "font-family-bold",
        "font-family-italic",
        "font-family-bold-italic",
        "font-style-bold",
        "font-style-italic",
        "font-style-bold-italic",
      ],
    },
    {
      id: "features-and-variations",
      name: "Features & variations",
      optionIds: [
        "font-feature",
        "font-variation",
        "font-variation-bold",
        "font-variation-italic",
        "font-variation-bold-italic",
      ],
    },
    {
      id: "rendering",
      name: "Rendering",
      optionIds: [
        "font-thicken",
        "font-thicken-strength",
        "font-codepoint-map",
      ],
    },
  ],
  colors: [
    {
      id: "theme-and-text",
      name: "Theme & text",
      optionIds: [
        "theme",
        "background",
        "foreground",
        "bold-color",
        "faint-opacity",
        "minimum-contrast",
      ],
    },
    {
      id: "cursor-and-selection",
      name: "Cursor & selection",
      optionIds: [
        "cursor-color",
        "cursor-text",
        "selection-background",
        "selection-foreground",
        "selection-clear-on-typing",
        "selection-clear-on-copy",
        "selection-word-chars",
      ],
    },
    {
      id: "search-matches",
      name: "Search matches",
      optionIds: [
        "search-foreground",
        "search-background",
        "search-selected-foreground",
        "search-selected-background",
      ],
    },
    {
      id: "palette",
      name: "Palette",
      optionIds: [
        "palette",
        "palette-generate",
        "palette-harmonious",
      ],
    },
    {
      id: "background-image",
      name: "Background image",
      optionIds: [
        "background-image",
        "background-image-opacity",
        "background-image-position",
        "background-image-fit",
        "background-image-repeat",
      ],
    },
  ],
  window: [
    {
      id: "appearance",
      name: "Appearance",
      optionIds: [
        "window-theme",
        "window-decoration",
        "window-title-font-family",
        "window-subtitle",
        "window-titlebar-background",
        "window-titlebar-foreground",
        "window-show-tab-bar",
        "scrollbar",
      ],
    },
    {
      id: "padding",
      name: "Padding",
      optionIds: [
        "window-padding-x",
        "window-padding-y",
        "window-padding-balance",
        "window-padding-color",
      ],
    },
    {
      id: "size-and-position",
      name: "Size & position",
      optionIds: [
        "window-width",
        "window-height",
        "window-position-x",
        "window-position-y",
        "window-step-resize",
        "window-save-state",
      ],
    },
    {
      id: "transparency-and-rendering",
      name: "Transparency & rendering",
      optionIds: [
        "background-opacity",
        "background-blur",
        "background-opacity-cells",
        "window-colorspace",
        "window-vsync",
      ],
    },
    {
      id: "splits",
      name: "Splits",
      optionIds: [
        "unfocused-split-opacity",
        "unfocused-split-fill",
        "split-divider-color",
        "split-preserve-zoom",
        "drag-handle",
      ],
    },
    {
      id: "new-tabs-and-windows",
      name: "New tabs & windows",
      optionIds: [
        "window-new-tab-position",
        "window-inherit-working-directory",
        "tab-inherit-working-directory",
        "split-inherit-working-directory",
        "window-inherit-font-size",
      ],
    },
    {
      id: "resize-overlay",
      name: "Resize overlay",
      optionIds: [
        "resize-overlay",
        "resize-overlay-position",
        "resize-overlay-duration",
      ],
    },
  ],
  cursor: [
    {
      id: "cursor",
      name: "Cursor",
      optionIds: [
        "cursor-style",
        "cursor-style-blink",
        "cursor-opacity",
        "cursor-click-to-move",
      ],
    },
  ],
  mouse: [
    {
      id: "mouse",
      name: "Mouse",
      optionIds: [
        "mouse-hide-while-typing",
        "mouse-reporting",
        "mouse-shift-capture",
        "mouse-scroll-multiplier",
        "scroll-to-bottom",
        "right-click-action",
        "middle-click-action",
        "focus-follows-mouse",
        "click-repeat-interval",
      ],
    },
  ],
  clipboard: [
    {
      id: "clipboard",
      name: "Clipboard",
      optionIds: [
        "clipboard-read",
        "clipboard-write",
        "clipboard-write-limit-bytes",
        "copy-on-select",
        "clipboard-trim-trailing-spaces",
        "clipboard-paste-protection",
        "clipboard-paste-bracketed-safe",
        "clipboard-codepoint-map",
      ],
    },
  ],
  keybinds: [
    {
      id: "keybinds",
      name: "Keybinds",
      optionIds: [
        "keybind",
        "key-remap",
      ],
    },
  ],
  shell: [
    {
      id: "shell",
      name: "Shell",
      optionIds: [
        "command",
        "initial-command",
        "input",
        "working-directory",
        "shell-integration",
        "shell-integration-features",
        "term",
        "env",
      ],
    },
  ],
  application: [
    {
      id: "startup",
      name: "Startup",
      optionIds: [
        "initial-window",
        "fullscreen",
        "maximize",
        "title",
        "config-file",
        "config-default-files",
      ],
    },
    {
      id: "notifications",
      name: "Notifications",
      optionIds: [
        "desktop-notifications",
        "app-notifications",
        "notify-on-command-finish",
        "notify-on-command-finish-action",
        "notify-on-command-finish-after",
      ],
    },
    {
      id: "links-and-command-palette",
      name: "Links & command palette",
      optionIds: [
        "link-url",
        "link-osc8",
        "link-previews",
        "link",
        "command-palette-entry",
      ],
    },
    {
      id: "bell",
      name: "Bell",
      optionIds: [
        "bell-features",
        "bell-audio-path",
        "bell-audio-volume",
      ],
    },
    {
      id: "closing-and-quitting",
      name: "Closing & quitting",
      optionIds: [
        "confirm-close-surface",
        "quit-after-last-window-closed",
        "quit-after-last-window-closed-delay",
        "wait-after-command",
        "abnormal-command-exit-runtime",
        "undo-timeout",
      ],
    },
  ],
  "quick-terminal": [
    {
      id: "placement",
      name: "Placement",
      optionIds: [
        "quick-terminal-position",
        "quick-terminal-size",
        "quick-terminal-screen",
        "quick-terminal-space-behavior",
      ],
    },
    {
      id: "behavior",
      name: "Behavior",
      optionIds: [
        "quick-terminal-animation-duration",
        "quick-terminal-autohide",
      ],
    },
    {
      id: "wayland",
      name: "Wayland",
      optionIds: [
        "gtk-quick-terminal-layer",
        "gtk-quick-terminal-namespace",
        "quick-terminal-keyboard-interactivity",
      ],
    },
  ],
  macos: [
    {
      id: "app-icon",
      name: "App icon",
      optionIds: [
        "macos-icon",
        "macos-icon-frame",
        "macos-icon-ghost-color",
        "macos-icon-screen-color",
        "macos-custom-icon",
      ],
    },
    {
      id: "window-and-titlebar",
      name: "Window & titlebar",
      optionIds: [
        "macos-titlebar-style",
        "macos-titlebar-proxy-icon",
        "macos-window-buttons",
        "macos-window-shadow",
        "macos-non-native-fullscreen",
      ],
    },
    {
      id: "keyboard-and-secure-input",
      name: "Keyboard & secure input",
      optionIds: [
        "macos-option-as-alt",
        "macos-auto-secure-input",
        "macos-secure-input-indication",
      ],
    },
    {
      id: "system-integration",
      name: "System integration",
      optionIds: [
        "macos-dock-drop-behavior",
        "macos-hidden",
        "macos-applescript",
        "macos-shortcuts",
      ],
    },
    {
      id: "updates",
      name: "Updates",
      optionIds: [
        "auto-update",
        "auto-update-channel",
      ],
    },
  ],
  linux: [
    {
      id: "titlebar-and-tabs",
      name: "Titlebar & tabs",
      optionIds: [
        "gtk-titlebar",
        "gtk-titlebar-hide-when-maximized",
        "gtk-titlebar-style",
        "gtk-toolbar-style",
        "gtk-tabs-location",
        "gtk-wide-tabs",
        "gtk-tabs-inverted",
        "gtk-horizontal-tab-scroll",
        "gtk-custom-css",
      ],
    },
    {
      id: "app-identity",
      name: "App identity",
      optionIds: [
        "gtk-single-instance",
        "class",
        "x11-instance-name",
        "language",
      ],
    },
    {
      id: "cgroups",
      name: "Cgroups",
      optionIds: [
        "linux-cgroup",
        "linux-cgroup-memory-limit",
        "linux-cgroup-processes-limit",
        "linux-cgroup-hard-fail",
      ],
    },
    {
      id: "system",
      name: "System",
      optionIds: [
        "async-backend",
        "gtk-opengl-debug",
      ],
    },
  ],
  advanced: [
    {
      id: "limits",
      name: "Limits",
      optionIds: [
        "scrollback-limit-bytes",
        "scrollback-limit-lines",
        "scrollback-compression",
        "image-storage-limit",
      ],
    },
    {
      id: "terminal-reports",
      name: "Terminal reports",
      optionIds: [
        "vt-window-resize-allowed",
        "vt-xt-checksum-report",
        "vt-xt-checksum-extension",
      ],
    },
    {
      id: "shaders",
      name: "Shaders",
      optionIds: [
        "custom-shader",
        "custom-shader-animation",
      ],
    },
    {
      id: "cell-metrics",
      name: "Cell metrics",
      optionIds: [
        "adjust-cell-width",
        "adjust-cell-height",
        "adjust-font-baseline",
        "adjust-icon-height",
      ],
    },
    {
      id: "line-and-cursor-metrics",
      name: "Line & cursor metrics",
      optionIds: [
        "adjust-underline-position",
        "adjust-underline-thickness",
        "adjust-strikethrough-position",
        "adjust-strikethrough-thickness",
        "adjust-overline-position",
        "adjust-overline-thickness",
        "adjust-box-thickness",
        "adjust-cursor-thickness",
        "adjust-cursor-height",
      ],
    },
    {
      id: "text-rendering",
      name: "Text rendering",
      optionIds: [
        "grapheme-width-method",
        "font-shaping-break",
        "alpha-blending",
        "freetype-load-flags",
      ],
    },
    {
      id: "terminal-protocol",
      name: "Terminal protocol",
      optionIds: [
        "osc-color-report-format",
        "vt-kam-allowed",
        "enquiry-response",
        "title-report",
        "progress-style",
      ],
    },
  ],
};

/**
 * Splits a category's visible options into its groups, in display order. Empty groups
 * are dropped. An option missing from the table lands in a trailing "Other" group
 * instead of disappearing.
 */
export function groupOptions(category: Category, options: readonly ConfigOption[]): OptionGroup[] {
  const byId = new Map(options.map((option) => [option.id, option]));
  const groups: OptionGroup[] = [];

  for (const definition of OPTION_GROUPS[category]) {
    const grouped = definition.optionIds.flatMap((id) => {
      const option = byId.get(id);
      byId.delete(id);
      return option ? [option] : [];
    });
    if (grouped.length > 0) {
      groups.push({ id: definition.id, name: definition.name, options: grouped });
    }
  }

  if (byId.size > 0) {
    groups.push({ id: "other", name: "Other", options: [...byId.values()] });
  }
  return groups;
}
