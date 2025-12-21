// Keybind validation for Ghostty configuration
// Based on: https://ghostty.org/docs/config/keybind/reference

// Valid modifiers (with aliases)
const VALID_MODIFIERS = new Set([
  "shift",
  "ctrl", "control",
  "alt", "opt", "option",
  "super", "cmd", "command",
]);

// Trigger prefixes
const TRIGGER_PREFIXES = new Set([
  "all",
  "global",
  "unconsumed",
  "performable",
  "physical",
]);

// Common function/special keys (from W3C spec)
const SPECIAL_KEYS = new Set([
  // Function keys
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
  "f13", "f14", "f15", "f16", "f17", "f18", "f19", "f20", "f21", "f22", "f23", "f24",
  // Navigation
  "up", "down", "left", "right",
  "home", "end", "page_up", "page_down", "pageup", "pagedown",
  // Editing
  "insert", "delete", "backspace", "tab", "enter", "return", "escape", "esc",
  // Whitespace
  "space",
  // Numpad
  "numpad0", "numpad1", "numpad2", "numpad3", "numpad4",
  "numpad5", "numpad6", "numpad7", "numpad8", "numpad9",
  "numpad_add", "numpad_subtract", "numpad_multiply", "numpad_divide",
  "numpad_decimal", "numpad_enter", "numpad_equal",
  // Media keys
  "audio_mute", "audio_volume_down", "audio_volume_up",
  "media_play_pause", "media_stop", "media_next", "media_prev",
  // Misc
  "print_screen", "scroll_lock", "pause", "caps_lock", "num_lock",
  "context_menu", "grave_accent", "backquote",
  // Brackets and symbols
  "bracket_left", "bracket_right", "backslash", "semicolon",
  "quote", "comma", "period", "slash", "minus", "equal",
]);

// Physical key codes (W3C specification - KeyA, KeyB, etc.)
const PHYSICAL_KEY_PATTERN = /^(key_?[a-z]|digit_?[0-9]|numpad_?[0-9]|arrow_?(up|down|left|right))$/i;

// Action categories for grouping in the UI
export type ActionCategory =
  | "basic"
  | "clipboard"
  | "font"
  | "scroll"
  | "selection"
  | "tab"
  | "split"
  | "window"
  | "system"
  | "text";

// Enhanced action definition with description and category
export interface KeybindAction {
  action: string;
  description: string;
  category: ActionCategory;
  hasParam: boolean;
  paramDesc?: string;
  paramOptions?: string[]; // For actions with fixed param options
  platform?: "macos" | "linux";
  deprecated?: boolean;
  deprecatedMessage?: string;
}

// All valid keybind actions with descriptions from official docs
// Source: https://ghostty.org/docs/config/keybind/reference
export const KEYBIND_ACTIONS: KeybindAction[] = [
  // === Basic ===
  {
    action: "ignore",
    description: "Ignore this key combination (won't process or forward to terminal)",
    category: "basic",
    hasParam: false
  },
  {
    action: "unbind",
    description: "Unbind a previously bound key binding",
    category: "basic",
    hasParam: false
  },
  {
    action: "reset",
    description: "Reset the terminal (fixes broken state, like running 'reset' command)",
    category: "basic",
    hasParam: false
  },

  // === Clipboard ===
  {
    action: "copy_to_clipboard",
    description: "Copy the selected text to the clipboard",
    category: "clipboard",
    hasParam: false
  },
  {
    action: "paste_from_clipboard",
    description: "Paste the contents of the default clipboard",
    category: "clipboard",
    hasParam: false
  },
  {
    action: "paste_from_selection",
    description: "Paste the contents of the selection clipboard",
    category: "clipboard",
    hasParam: false
  },
  {
    action: "copy_url_to_clipboard",
    description: "Copy the URL under the cursor to the clipboard",
    category: "clipboard",
    hasParam: false
  },
  {
    action: "copy_title_to_clipboard",
    description: "Copy the terminal title to the clipboard",
    category: "clipboard",
    hasParam: false
  },

  // === Font ===
  {
    action: "increase_font_size",
    description: "Increase font size by specified points",
    category: "font",
    hasParam: true,
    paramDesc: "Amount in points (e.g., 1 or 1.5)"
  },
  {
    action: "decrease_font_size",
    description: "Decrease font size by specified points",
    category: "font",
    hasParam: true,
    paramDesc: "Amount in points (e.g., 1 or 1.5)"
  },
  {
    action: "reset_font_size",
    description: "Reset font size to the original configured size",
    category: "font",
    hasParam: false
  },
  {
    action: "set_font_size",
    description: "Set font size to a specific value in points",
    category: "font",
    hasParam: true,
    paramDesc: "Font size in points (e.g., 14)"
  },

  // === Scroll ===
  {
    action: "scroll_to_top",
    description: "Scroll to the top of the scrollback buffer",
    category: "scroll",
    hasParam: false
  },
  {
    action: "scroll_to_bottom",
    description: "Scroll to the bottom of the screen",
    category: "scroll",
    hasParam: false
  },
  {
    action: "scroll_to_selection",
    description: "Scroll to the currently selected text",
    category: "scroll",
    hasParam: false
  },
  {
    action: "scroll_page_up",
    description: "Scroll the screen up by one page",
    category: "scroll",
    hasParam: false
  },
  {
    action: "scroll_page_down",
    description: "Scroll the screen down by one page",
    category: "scroll",
    hasParam: false
  },
  {
    action: "scroll_page_fractional",
    description: "Scroll by a fraction of a page (positive=down, negative=up)",
    category: "scroll",
    hasParam: true,
    paramDesc: "Fraction (e.g., 0.5 or -0.5)"
  },
  {
    action: "scroll_page_lines",
    description: "Scroll by a number of lines (positive=down, negative=up)",
    category: "scroll",
    hasParam: true,
    paramDesc: "Number of lines (e.g., 3 or -3)"
  },
  {
    action: "jump_to_prompt",
    description: "Jump forward/back by prompts (requires shell integration)",
    category: "scroll",
    hasParam: true,
    paramDesc: "Number (positive=forward, negative=back)"
  },

  // === Selection ===
  {
    action: "select_all",
    description: "Select all text on the screen",
    category: "selection",
    hasParam: false
  },
  {
    action: "adjust_selection",
    description: "Adjust the current selection in the given direction",
    category: "selection",
    hasParam: true,
    paramDesc: "Direction",
    paramOptions: ["left", "right", "up", "down", "page_up", "page_down", "home", "end", "beginning_of_line", "end_of_line"]
  },

  // === Tab ===
  {
    action: "new_tab",
    description: "Open a new tab",
    category: "tab",
    hasParam: false
  },
  {
    action: "previous_tab",
    description: "Go to the previous tab",
    category: "tab",
    hasParam: false
  },
  {
    action: "next_tab",
    description: "Go to the next tab",
    category: "tab",
    hasParam: false
  },
  {
    action: "last_tab",
    description: "Go to the last tab",
    category: "tab",
    hasParam: false
  },
  {
    action: "goto_tab",
    description: "Go to a specific tab by index (1-based)",
    category: "tab",
    hasParam: true,
    paramDesc: "Tab index (e.g., 1, 2, 3)"
  },
  {
    action: "move_tab",
    description: "Move current tab by relative offset (wraps around)",
    category: "tab",
    hasParam: true,
    paramDesc: "Offset (e.g., 1 or -1)"
  },
  {
    action: "toggle_tab_overview",
    description: "Toggle the tab overview (Linux with libadwaita 1.4+)",
    category: "tab",
    hasParam: false,
    platform: "linux"
  },
  {
    action: "close_tab",
    description: "Close the current tab and all its splits",
    category: "tab",
    hasParam: false
  },

  // === Split ===
  {
    action: "new_split",
    description: "Create a new split in the specified direction",
    category: "split",
    hasParam: true,
    paramDesc: "Direction",
    paramOptions: ["right", "down", "left", "up", "auto"]
  },
  {
    action: "goto_split",
    description: "Focus on a split in the specified direction or order",
    category: "split",
    hasParam: true,
    paramDesc: "Direction",
    paramOptions: ["right", "down", "left", "up", "previous", "next"]
  },
  {
    action: "toggle_split_zoom",
    description: "Zoom in/out of the current split (hides other splits)",
    category: "split",
    hasParam: false
  },
  {
    action: "resize_split",
    description: "Resize the current split in direction by pixels",
    category: "split",
    hasParam: true,
    paramDesc: "direction,pixels (e.g., up,10)"
  },
  {
    action: "equalize_splits",
    description: "Equalize the size of all splits in the window",
    category: "split",
    hasParam: false
  },

  // === Window ===
  {
    action: "new_window",
    description: "Open a new window (brings app to front if unfocused)",
    category: "window",
    hasParam: false
  },
  {
    action: "close_surface",
    description: "Close the current surface (window, tab, or split)",
    category: "window",
    hasParam: false
  },
  {
    action: "close_window",
    description: "Close the current window and all its tabs/splits",
    category: "window",
    hasParam: false
  },
  {
    action: "close_all_windows",
    description: "Close all windows",
    category: "window",
    hasParam: false,
    deprecated: true,
    deprecatedMessage: "Use all:close_window instead"
  },
  {
    action: "toggle_fullscreen",
    description: "Toggle fullscreen mode for the current window",
    category: "window",
    hasParam: false
  },
  {
    action: "toggle_maximize",
    description: "Toggle maximize for the current window (Linux only)",
    category: "window",
    hasParam: false,
    platform: "linux"
  },
  {
    action: "toggle_window_decorations",
    description: "Toggle window decorations (titlebar, etc.) (Linux only)",
    category: "window",
    hasParam: false,
    platform: "linux"
  },
  {
    action: "toggle_window_float_on_top",
    description: "Toggle window always-on-top",
    category: "window",
    hasParam: false
  },
  {
    action: "reset_window_size",
    description: "Reset window to default size (macOS only)",
    category: "window",
    hasParam: false,
    platform: "macos"
  },
  {
    action: "prompt_surface_title",
    description: "Change surface title via popup prompt (Linux libadwaita 1.5+)",
    category: "window",
    hasParam: false,
    platform: "linux"
  },

  // === System ===
  {
    action: "open_config",
    description: "Open the config file in the default OS editor",
    category: "system",
    hasParam: false
  },
  {
    action: "reload_config",
    description: "Reload the configuration file",
    category: "system",
    hasParam: false
  },
  {
    action: "toggle_quick_terminal",
    description: "Toggle the quick terminal dropdown",
    category: "system",
    hasParam: false
  },
  {
    action: "toggle_command_palette",
    description: "Toggle the command palette",
    category: "system",
    hasParam: false
  },
  {
    action: "toggle_visibility",
    description: "Toggle application visibility",
    category: "system",
    hasParam: false
  },
  {
    action: "toggle_secure_input",
    description: "Toggle secure input mode",
    category: "system",
    hasParam: false
  },
  {
    action: "check_for_updates",
    description: "Check for application updates",
    category: "system",
    hasParam: false
  },
  {
    action: "inspector",
    description: "Control the terminal inspector visibility",
    category: "system",
    hasParam: true,
    paramDesc: "Mode",
    paramOptions: ["toggle", "show", "hide"]
  },
  {
    action: "show_gtk_inspector",
    description: "Show the GTK inspector (Linux only)",
    category: "system",
    hasParam: false,
    platform: "linux"
  },
  {
    action: "show_on_screen_keyboard",
    description: "Show the on-screen keyboard (Linux GTK only)",
    category: "system",
    hasParam: false,
    platform: "linux"
  },
  {
    action: "undo",
    description: "Undo the last action",
    category: "system",
    hasParam: false
  },
  {
    action: "redo",
    description: "Redo the last undone action",
    category: "system",
    hasParam: false
  },
  {
    action: "quit",
    description: "Quit the application",
    category: "system",
    hasParam: false
  },
  {
    action: "clear_screen",
    description: "Clear the screen and all scrollback",
    category: "system",
    hasParam: false
  },

  // === Text/Input ===
  {
    action: "csi",
    description: "Send a CSI sequence (without ESC [ prefix)",
    category: "text",
    hasParam: true,
    paramDesc: "CSI sequence (e.g., 0m to reset styles)"
  },
  {
    action: "esc",
    description: "Send an ESC sequence",
    category: "text",
    hasParam: true,
    paramDesc: "ESC sequence"
  },
  {
    action: "text",
    description: "Send the specified text (Zig string literal syntax)",
    category: "text",
    hasParam: true,
    paramDesc: "Text to send"
  },
  {
    action: "cursor_key",
    description: "Send data based on cursor key mode",
    category: "text",
    hasParam: true,
    paramDesc: "Mode",
    paramOptions: ["application", "normal"]
  },
  {
    action: "write_scrollback_file",
    description: "Write entire scrollback to a temp file",
    category: "text",
    hasParam: true,
    paramDesc: "Action",
    paramOptions: ["copy", "paste", "open"]
  },
  {
    action: "write_screen_file",
    description: "Write screen contents to a temp file",
    category: "text",
    hasParam: true,
    paramDesc: "Action",
    paramOptions: ["copy", "paste", "open"]
  },
  {
    action: "write_selection_file",
    description: "Write selected text to a temp file",
    category: "text",
    hasParam: true,
    paramDesc: "Action",
    paramOptions: ["copy", "paste", "open"]
  },
];

// Build a set of action names for quick lookup
const ACTION_NAMES = new Set(KEYBIND_ACTIONS.map(a => a.action));

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TriggerValidation {
  valid: boolean;
  error?: string;
  prefixes: string[];
  modifiers: string[];
  key: string;
}

export interface ActionValidation {
  valid: boolean;
  error?: string;
  action: string;
  param?: string;
}

export function validateTrigger(trigger: string): TriggerValidation {
  const result: TriggerValidation = {
    valid: true,
    prefixes: [],
    modifiers: [],
    key: "",
  };

  if (!trigger || trigger.trim() === "") {
    return { ...result, valid: false, error: "Trigger cannot be empty" };
  }

  // Split by + to get parts
  const parts = trigger.toLowerCase().split("+").map(p => p.trim()).filter(p => p);

  if (parts.length === 0) {
    return { ...result, valid: false, error: "Invalid trigger format" };
  }

  // Handle prefixes in the first part if they contain ":"
  const firstPart = parts[0];
  if (firstPart.includes(":")) {
    const prefixParts = firstPart.split(":");
    // All but the last are prefixes
    for (let i = 0; i < prefixParts.length - 1; i++) {
      const prefix = prefixParts[i].trim();
      if (prefix && !TRIGGER_PREFIXES.has(prefix)) {
        return { ...result, valid: false, error: `Invalid prefix: "${prefix}". Valid prefixes: ${Array.from(TRIGGER_PREFIXES).join(", ")}` };
      }
      if (prefix) {
        result.prefixes.push(prefix);
      }
    }
    // Replace first part with the last segment (the actual key/modifier)
    parts[0] = prefixParts[prefixParts.length - 1].trim();
  }

  // Track modifiers we've seen to detect duplicates
  const seenModifiers = new Set<string>();
  let keyFound = false;

  for (const part of parts) {
    if (!part) continue;

    // Check if it's a modifier
    if (VALID_MODIFIERS.has(part)) {
      // Normalize alias
      let normalizedMod = part;
      if (part === "control") normalizedMod = "ctrl";
      if (part === "opt" || part === "option") normalizedMod = "alt";
      if (part === "cmd" || part === "command") normalizedMod = "super";

      if (seenModifiers.has(normalizedMod)) {
        return { ...result, valid: false, error: `Duplicate modifier: "${part}"` };
      }
      seenModifiers.add(normalizedMod);
      result.modifiers.push(normalizedMod);
    } else {
      // It's the key
      if (keyFound) {
        return { ...result, valid: false, error: "Only one key is allowed per trigger (multiple keys found)" };
      }

      // Validate the key
      if (!isValidKey(part)) {
        return { ...result, valid: false, error: `Invalid key: "${part}"` };
      }

      result.key = part;
      keyFound = true;
    }
  }

  if (!keyFound) {
    return { ...result, valid: false, error: "No key specified in trigger" };
  }

  return result;
}

// Validate trigger sequences (handles ">" separator like ctrl+x>2)
export interface TriggerSequenceValidation {
  valid: boolean;
  error?: string;
  sequences: TriggerValidation[];
}

export function validateTriggerSequence(triggerSeq: string): TriggerSequenceValidation {
  const result: TriggerSequenceValidation = {
    valid: true,
    sequences: [],
  };

  if (!triggerSeq || triggerSeq.trim() === "") {
    return { valid: false, error: "Trigger cannot be empty", sequences: [] };
  }

  // Split by > to get individual triggers in the sequence
  const triggerParts = triggerSeq.split(">").map(t => t.trim()).filter(t => t);

  if (triggerParts.length === 0) {
    return { valid: false, error: "Invalid trigger format", sequences: [] };
  }

  for (let i = 0; i < triggerParts.length; i++) {
    const triggerPart = triggerParts[i];
    const validation = validateTrigger(triggerPart);
    result.sequences.push(validation);

    if (!validation.valid) {
      result.valid = false;
      result.error = `Sequence part ${i + 1}: ${validation.error}`;
      break;
    }
  }

  return result;
}

function isValidKey(key: string): boolean {
  // Check special keys
  if (SPECIAL_KEYS.has(key.toLowerCase())) {
    return true;
  }

  // Check physical key codes (KeyA, key_a, etc.)
  if (PHYSICAL_KEY_PATTERN.test(key)) {
    return true;
  }

  // Single character (Unicode codepoint)
  if (key.length === 1) {
    return true;
  }

  // Common single character representations
  if (/^[a-z0-9]$/.test(key)) {
    return true;
  }

  // Allow some common key names that might not be in our list
  const commonKeys = ["plus", "minus", "equal", "equals", "apostrophe", "grave"];
  if (commonKeys.includes(key.toLowerCase())) {
    return true;
  }

  return false;
}

export function validateAction(actionStr: string): ActionValidation {
  const result: ActionValidation = {
    valid: true,
    action: "",
  };

  if (!actionStr || actionStr.trim() === "") {
    return { ...result, valid: false, error: "Action cannot be empty" };
  }

  // Split by : to separate action from param
  const colonIndex = actionStr.indexOf(":");

  if (colonIndex === -1) {
    // No parameter
    result.action = actionStr.trim().toLowerCase();
  } else {
    result.action = actionStr.slice(0, colonIndex).trim().toLowerCase();
    result.param = actionStr.slice(colonIndex + 1);
  }

  // Check if action exists
  if (!ACTION_NAMES.has(result.action)) {
    return {
      ...result,
      valid: false,
      error: `Unknown action: "${result.action}"`
    };
  }

  // Check if action requires param
  const actionDef = KEYBIND_ACTIONS.find(a => a.action === result.action);
  if (actionDef?.hasParam && !result.param) {
    return {
      ...result,
      valid: false,
      error: `Action "${result.action}" requires a parameter (${actionDef.paramDesc})`,
    };
  }

  return result;
}

export function validateKeybind(keybind: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!keybind || keybind.trim() === "") {
    return { valid: false, errors: ["Keybind cannot be empty"], warnings: [] };
  }

  // Split by = to get trigger and action
  const equalsIndex = keybind.indexOf("=");

  if (equalsIndex === -1) {
    return {
      valid: false,
      errors: ["Invalid format. Expected: trigger=action (e.g., ctrl+c=copy_to_clipboard)"],
      warnings: []
    };
  }

  const trigger = keybind.slice(0, equalsIndex).trim();
  const action = keybind.slice(equalsIndex + 1).trim();

  // Handle trigger sequences (e.g., ctrl+a>n)
  const triggerParts = trigger.split(">").map(t => t.trim()).filter(t => t);

  for (const triggerPart of triggerParts) {
    const triggerValidation = validateTrigger(triggerPart);
    if (!triggerValidation.valid && triggerValidation.error) {
      result.errors.push(triggerValidation.error);
      result.valid = false;
    }
  }

  // Validate action
  const actionValidation = validateAction(action);
  if (!actionValidation.valid && actionValidation.error) {
    result.errors.push(actionValidation.error);
    result.valid = false;
  }

  // Add warnings for deprecated actions
  if (actionValidation.action === "close_all_windows") {
    result.warnings.push("close_all_windows is deprecated. Use all:close_window instead.");
  }

  return result;
}

// Helper to get autocomplete suggestions for actions
export function getActionSuggestions(partial: string): typeof KEYBIND_ACTIONS {
  const lower = partial.toLowerCase();
  return KEYBIND_ACTIONS.filter(a => a.action.includes(lower));
}

// Helper to get common keybind examples
export const KEYBIND_EXAMPLES = [
  { trigger: "ctrl+c", action: "copy_to_clipboard", description: "Copy selection" },
  { trigger: "ctrl+v", action: "paste_from_clipboard", description: "Paste" },
  { trigger: "ctrl+shift+t", action: "new_tab", description: "New tab" },
  { trigger: "ctrl+shift+n", action: "new_window", description: "New window" },
  { trigger: "ctrl+plus", action: "increase_font_size:1", description: "Increase font" },
  { trigger: "ctrl+minus", action: "decrease_font_size:1", description: "Decrease font" },
  { trigger: "ctrl+0", action: "reset_font_size", description: "Reset font size" },
  { trigger: "ctrl+shift+w", action: "close_tab", description: "Close tab" },
  { trigger: "f11", action: "toggle_fullscreen", description: "Toggle fullscreen" },
];
