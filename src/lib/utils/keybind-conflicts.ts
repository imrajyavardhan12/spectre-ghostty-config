// Replays `keybind` entries in order the way Ghostty 1.3 resolves them, to
// find rows that end up with no effect. Sources:
// - https://ghostty.org/docs/config/reference#keybind
// - https://ghostty.org/docs/config/keybind
// - Ghostty v1.3.1 src/config/Config.zig (Keybinds.parseCLI) and
//   src/input/Binding.zig (Parser, Trigger.parse, Set.parseAndPut)

import { findKeybindDelimiter } from "@/lib/utils/keybind-validation";

export type KeybindConflictKind =
  /** A later row binds the same trigger to a different action. */
  | "overridden"
  /** A later row binds the same trigger to the same action. */
  | "duplicate"
  /** A later row uses this trigger as the first part of a sequence. */
  | "sequence-prefix"
  /** A later row binds this sequence's prefix directly. */
  | "prefix-rebound"
  /** A later `unbind` row removes this binding. */
  | "unbound"
  /** A later `keybind = clear` removes every binding. */
  | "cleared"
  /** A later `table/` row resets this binding's key table. */
  | "table-cleared";

export interface KeybindConflict {
  /** Zero-based index of the ineffective row. */
  row: number;
  kind: KeybindConflictKind;
  /** Zero-based index of the row that made it ineffective. */
  byRow: number;
}

// Trigger flags Ghostty strips before parsing the trigger. `physical:` is not
// a flag in 1.3; it only survives as part of 1.1.x key names below.
const TRIGGER_FLAGS = new Set(["all", "global", "unconsumed", "performable"]);

const MODIFIERS: Record<string, string> = {
  shift: "shift",
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  opt: "alt",
  option: "alt",
  super: "super",
  cmd: "super",
  command: "super",
};

// Ghostty 1.1.x key names still accepted by 1.3 (Binding.zig
// `backwards_compatible_keys`), mapped to the key they now resolve to.
const LEGACY_KEYS: Record<string, string> = (() => {
  const map: Record<string, string> = {
    plus: "u:+",
    apostrophe: "u:'",
    grave_accent: "p:backquote",
    left_bracket: "p:bracket_left",
    right_bracket: "p:bracket_right",
    "physical:apostrophe": "p:quote",
    "physical:grave_accent": "p:backquote",
    "physical:left_bracket": "p:bracket_left",
    "physical:right_bracket": "p:bracket_right",
  };
  const digits = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  digits.forEach((name, digit) => {
    map[name] = `u:${digit}`;
    map[`physical:${name}`] = `p:digit_${digit}`;
  });
  for (const direction of ["up", "down", "left", "right"]) {
    map[direction] = `p:arrow_${direction}`;
    map[`physical:${direction}`] = `p:arrow_${direction}`;
  }
  const keypad = [
    ...Array.from({ length: 10 }, (_, digit) => String(digit)),
    "add", "subtract", "multiply", "divide", "decimal", "enter", "equal",
    "separator", "left", "right", "up", "down", "page_up", "page_down",
    "home", "end", "insert", "delete", "begin",
  ];
  for (const name of keypad) {
    map[`kp_${name}`] = `p:numpad_${name}`;
    map[`physical:kp_${name}`] = `p:numpad_${name}`;
  }
  const sides: Array<[string, string]> = [
    ["shift", "shift"], ["control", "control"], ["alt", "alt"], ["super", "meta"],
  ];
  for (const [legacy, modern] of sides) {
    for (const side of ["left", "right"]) {
      map[`${side}_${legacy}`] = `p:${modern}_${side}`;
      map[`physical:${side}_${legacy}`] = `p:${modern}_${side}`;
    }
  }
  return map;
})();

/** W3C camel-case codes (`KeyA`, `ArrowUp`, `F5`) to Ghostty's snake case. */
function w3cToSnake(code: string): string {
  if (/^F\d+$/.test(code)) return code.toLowerCase();
  return code
    .replace(/([a-z])([A-Z0-9])/g, "$1_$2")
    .replace(/([0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

/** Canonical identity for a trigger key, or null if Ghostty would reject it. */
function canonicalKey(part: string): string | null {
  if (part === "") return "u:+";
  if (part === "catch_all") return "catch_all";
  if (LEGACY_KEYS[part]) return LEGACY_KEYS[part];

  const codepoints = Array.from(part);
  if (codepoints.length === 1) {
    // Trigger hashing case-folds codepoints, so `ctrl+A` equals `ctrl+a`.
    return `u:${part.toLowerCase()}`;
  }
  // Key enum names are lowercase snake case and matched case-sensitively.
  if (/^[a-z][a-z0-9_]*$/.test(part)) return `p:${part}`;
  if (/^[A-Z][A-Za-z0-9]*$/.test(part)) return `p:${w3cToSnake(part)}`;
  return null;
}

/** Canonical identity for one trigger in a sequence (no flags), or null. */
function canonicalStep(step: string): string | null {
  const modifiers = new Set<string>();
  let key: string | null = null;
  const parts = step.split("+");
  // A trailing empty part after splitting `ctrl++` is the literal plus key.
  if (parts.length > 1 && parts[parts.length - 1] === "" && parts[parts.length - 2] === "") {
    parts.pop();
  }

  for (const part of parts) {
    const modifier = MODIFIERS[part];
    if (modifier) {
      if (modifiers.has(modifier)) return null;
      modifiers.add(modifier);
      continue;
    }
    if (key !== null) return null;
    key = canonicalKey(part);
    if (key === null) return null;
  }

  if (key === null) return null;
  return [...[...modifiers].sort(), key].join("+");
}

type ParsedEntry =
  | { kind: "clear" }
  | { kind: "table-clear"; table: string }
  | { kind: "binding"; table: string; sequence: string[]; action: string }
  | { kind: "ignored" };

const ROOT_TABLE = "";

function parseEntry(raw: string): ParsedEntry {
  const value = raw.trim();
  if (value === "") return { kind: "ignored" };
  if (value === "clear") return { kind: "clear" };

  // Key tables: `name/` or `name/binding`, with `/` before the first `=` and
  // no `+` or `>` in the name (Config.zig Keybinds.parseCLI).
  let table = ROOT_TABLE;
  let binding = value;
  const eqIndex = value.indexOf("=");
  const slashIndex = value.slice(0, eqIndex === -1 ? value.length : eqIndex).indexOf("/");
  if (slashIndex > 0 && !/[+>]/.test(value.slice(0, slashIndex))) {
    table = value.slice(0, slashIndex);
    binding = value.slice(slashIndex + 1);
    if (binding === "") return { kind: "table-clear", table };
  }

  // Strip leading flags; they are not part of trigger identity.
  let input = binding;
  for (;;) {
    const colon = input.indexOf(":");
    if (colon === -1 || !TRIGGER_FLAGS.has(input.slice(0, colon))) break;
    input = input.slice(colon + 1);
  }

  const delimiter = findKeybindDelimiter(input);
  if (delimiter === -1) return { kind: "ignored" };
  const trigger = input.slice(0, delimiter).trim();
  const action = input.slice(delimiter + 1).trim();
  // Chains attach to the previous binding and never own a trigger.
  if (trigger === "chain" || action === "") return { kind: "ignored" };

  const sequence: string[] = [];
  for (const step of trigger.split(">")) {
    const canonical = canonicalStep(step.trim());
    if (canonical === null) return { kind: "ignored" };
    sequence.push(canonical);
  }

  return { kind: "binding", table, sequence, action };
}

function normalizeAction(action: string): string {
  const colon = action.indexOf(":");
  return colon === -1
    ? action.toLowerCase()
    : `${action.slice(0, colon).toLowerCase()}:${action.slice(colon + 1)}`;
}

/**
 * Find `keybind` rows that have no effect once Ghostty applies all rows in
 * order. Invalid rows are ignored (the row validator reports them). Returns
 * at most one conflict per row: the first thing that removed it.
 */
export function analyzeKeybindConflicts(entries: readonly string[]): KeybindConflict[] {
  // table -> sequence key ("ctrl+u:a>u:n") -> row index of the active binding
  const tables = new Map<string, Map<string, number>>();
  const conflicts = new Map<number, KeybindConflict>();

  const tableFor = (name: string) => {
    let table = tables.get(name);
    if (!table) {
      table = new Map();
      tables.set(name, table);
    }
    return table;
  };
  const remove = (table: Map<string, number>, key: string, kind: KeybindConflictKind, byRow: number) => {
    const row = table.get(key);
    if (row === undefined) return;
    table.delete(key);
    if (!conflicts.has(row)) conflicts.set(row, { row, kind, byRow });
  };
  const removeDescendants = (table: Map<string, number>, key: string, kind: KeybindConflictKind, byRow: number) => {
    for (const existing of [...table.keys()]) {
      if (existing.startsWith(`${key}>`)) remove(table, existing, kind, byRow);
    }
  };

  const actions = new Map<number, string>();

  entries.forEach((raw, index) => {
    const entry = parseEntry(raw);

    if (entry.kind === "clear") {
      // `keybind = clear` resets the root set and every key table.
      for (const table of tables.values()) {
        for (const key of [...table.keys()]) remove(table, key, "cleared", index);
      }
      return;
    }

    if (entry.kind === "table-clear") {
      const table = tableFor(entry.table);
      for (const key of [...table.keys()]) remove(table, key, "table-cleared", index);
      return;
    }

    if (entry.kind !== "binding") return;

    const table = tableFor(entry.table);
    const key = entry.sequence.join(">");
    const prefixes = entry.sequence
      .slice(0, -1)
      .map((_, length) => entry.sequence.slice(0, length + 1).join(">"));

    if (entry.action === "unbind") {
      // A bound prefix never coexists with sequences under it, so unbinding
      // through one finds nothing here, matching Ghostty restoring that
      // prefix's action (Set.parseAndPutRecurse).
      remove(table, key, "unbound", index);
      removeDescendants(table, key, "unbound", index);
      return;
    }

    // A bound prefix of this sequence becomes a leader and loses its action.
    for (const prefix of prefixes) remove(table, prefix, "sequence-prefix", index);

    const previous = table.get(key);
    if (previous !== undefined) {
      const same = actions.get(previous) === normalizeAction(entry.action);
      remove(table, key, same ? "duplicate" : "overridden", index);
    }

    // Binding a sequence's prefix directly unbinds the whole sequence.
    removeDescendants(table, key, "prefix-rebound", index);

    table.set(key, index);
    actions.set(index, normalizeAction(entry.action));
  });

  return [...conflicts.values()].sort((a, b) => a.row - b.row);
}

/** One-sentence explanation of a conflict, with 1-based row numbers. */
export function describeKeybindConflict(conflict: KeybindConflict): string {
  const by = conflict.byRow + 1;
  switch (conflict.kind) {
    case "overridden":
      return `No effect: row ${by} binds the same trigger to a different action.`;
    case "duplicate":
      return `No effect: duplicate of row ${by}.`;
    case "sequence-prefix":
      return `No effect: row ${by} uses this trigger to start a key sequence.`;
    case "prefix-rebound":
      return `No effect: row ${by} binds this sequence's first keys directly.`;
    case "unbound":
      return `No effect: removed by the unbind on row ${by}.`;
    case "cleared":
      return `No effect: removed by keybind = clear on row ${by}.`;
    case "table-cleared":
      return `No effect: removed by the key table reset on row ${by}.`;
  }
}
