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

// All valid keybind actions with optional parameter indicator
export const KEYBIND_ACTIONS: { action: string; hasParam: boolean; paramDesc?: string }[] = [
  // No param actions
  { action: "ignore", hasParam: false },
  { action: "unbind", hasParam: false },
  { action: "reset", hasParam: false },
  { action: "copy_to_clipboard", hasParam: false },
  { action: "paste_from_clipboard", hasParam: false },
  { action: "paste_from_selection", hasParam: false },
  { action: "copy_url_to_clipboard", hasParam: false },
  { action: "copy_title_to_clipboard", hasParam: false },
  { action: "reset_font_size", hasParam: false },
  { action: "clear_screen", hasParam: false },
  { action: "select_all", hasParam: false },
  { action: "scroll_to_top", hasParam: false },
  { action: "scroll_to_bottom", hasParam: false },
  { action: "scroll_page_up", hasParam: false },
  { action: "scroll_page_down", hasParam: false },
  { action: "new_window", hasParam: false },
  { action: "new_tab", hasParam: false },
  { action: "previous_tab", hasParam: false },
  { action: "next_tab", hasParam: false },
  { action: "last_tab", hasParam: false },
  { action: "toggle_tab_overview", hasParam: false },
  { action: "new_split_right", hasParam: false },
  { action: "new_split_left", hasParam: false },
  { action: "new_split_up", hasParam: false },
  { action: "new_split_down", hasParam: false },
  { action: "toggle_split_zoom", hasParam: false },
  { action: "equalize_splits", hasParam: false },
  { action: "open_config", hasParam: false },
  { action: "reload_config", hasParam: false },
  { action: "close_surface", hasParam: false },
  { action: "close_tab", hasParam: false },
  { action: "close_window", hasParam: false },
  { action: "close_all_windows", hasParam: false },
  { action: "toggle_maximize", hasParam: false },
  { action: "toggle_fullscreen", hasParam: false },
  { action: "toggle_window_decorations", hasParam: false },
  { action: "toggle_window_float_on_top", hasParam: false },
  { action: "toggle_secure_input", hasParam: false },
  { action: "toggle_command_palette", hasParam: false },
  { action: "toggle_quick_terminal", hasParam: false },
  { action: "toggle_visibility", hasParam: false },
  { action: "check_for_updates", hasParam: false },
  { action: "undo", hasParam: false },
  { action: "redo", hasParam: false },
  { action: "quit", hasParam: false },
  
  // With param actions
  { action: "csi", hasParam: true, paramDesc: "CSI sequence (e.g., A for cursor up)" },
  { action: "esc", hasParam: true, paramDesc: "ESC sequence" },
  { action: "text", hasParam: true, paramDesc: "Text to send (Zig string literal syntax)" },
  { action: "cursor_key", hasParam: true, paramDesc: "application|normal" },
  { action: "increase_font_size", hasParam: true, paramDesc: "Amount in points (e.g., 1)" },
  { action: "decrease_font_size", hasParam: true, paramDesc: "Amount in points (e.g., 1)" },
  { action: "set_font_size", hasParam: true, paramDesc: "Font size in points (e.g., 14)" },
  { action: "scroll_page_fractional", hasParam: true, paramDesc: "Fraction (e.g., 0.5 or -0.5)" },
  { action: "scroll_page_lines", hasParam: true, paramDesc: "Number of lines (e.g., 3 or -3)" },
  { action: "adjust_selection", hasParam: true, paramDesc: "left|right|up|down|page_up|page_down|home|end" },
  { action: "jump_to_prompt", hasParam: true, paramDesc: "Number (positive=forward, negative=back)" },
  { action: "write_scrollback_file", hasParam: true, paramDesc: "copy|paste|open" },
  { action: "write_screen_file", hasParam: true, paramDesc: "copy|paste|open" },
  { action: "write_selection_file", hasParam: true, paramDesc: "copy|paste|open" },
  { action: "goto_tab", hasParam: true, paramDesc: "Tab index (1-based)" },
  { action: "move_tab", hasParam: true, paramDesc: "Relative offset (e.g., 1 or -1)" },
  { action: "goto_split", hasParam: true, paramDesc: "previous|next|up|down|left|right" },
  { action: "focus_split", hasParam: true, paramDesc: "previous|next|up|down|left|right" },
  { action: "resize_split", hasParam: true, paramDesc: "up|down|left|right" },
  { action: "inspector", hasParam: true, paramDesc: "toggle|show|hide" },
  { action: "crash", hasParam: true, paramDesc: "main|io|render (for testing)" },
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
