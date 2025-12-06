// Ghostty Configuration Schema Types

export type OptionType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "color"
  | "palette"
  | "keybind"
  | "duration";

export type Platform = "macos" | "linux" | "windows";

export type Category =
  | "fonts"
  | "colors"
  | "window"
  | "cursor"
  | "mouse"
  | "clipboard"
  | "keybinds"
  | "shell"
  | "application"
  | "quick-terminal"
  | "macos"
  | "linux"
  | "advanced";

export interface BaseConfigOption {
  id: string;
  name: string;
  description: string;
  type: OptionType;
  default: unknown;
  category: Category;
  subcategory?: string;
  platform?: Platform[];
  sinceVersion?: string;
  deprecated?: boolean;
  note?: string;
  hidden?: boolean; // Hide from settings UI (managed elsewhere)
}

export interface StringOption extends BaseConfigOption {
  type: "string";
  default: string;
  placeholder?: string;
  repeatable?: boolean;
}

export interface NumberOption extends BaseConfigOption {
  type: "number";
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanOption extends BaseConfigOption {
  type: "boolean";
  default: boolean;
}

export interface EnumOption extends BaseConfigOption {
  type: "enum";
  default: string;
  options: { value: string; label: string }[];
}

export interface ColorOption extends BaseConfigOption {
  type: "color";
  default: string;
}

export interface PaletteOption extends BaseConfigOption {
  type: "palette";
  default: string[];
}

export interface KeybindOption extends BaseConfigOption {
  type: "keybind";
  default: string[];
}

export interface DurationOption extends BaseConfigOption {
  type: "duration";
  default: string;
  placeholder?: string;
}

export type ConfigOption =
  | StringOption
  | NumberOption
  | BooleanOption
  | EnumOption
  | ColorOption
  | PaletteOption
  | KeybindOption
  | DurationOption;

export interface ConfigCategory {
  id: Category;
  name: string;
  description?: string;
  icon?: string;
}

export interface ConfigGroup {
  id: string;
  name: string;
  category: Category;
  description?: string;
  options: ConfigOption[];
}

// Type for the config values store
export type ConfigValues = Record<string, unknown>;

// Hex color type
export type HexColor = `#${string}` | "";
