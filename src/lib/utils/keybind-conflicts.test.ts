import { describe, expect, it } from "vitest";
import {
  analyzeKeybindConflicts,
  describeKeybindConflict,
  findDefaultKeybindOverrides,
} from "@/lib/utils/keybind-conflicts";

describe("analyzeKeybindConflicts", () => {
  it("returns nothing when every row is effective", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+a=copy_to_clipboard",
        "ctrl+b=paste_from_clipboard",
        "ctrl+x>n=new_window",
        "ctrl+x>t=new_tab",
      ])
    ).toEqual([]);
  });

  // Reference: "Duplicate triggers will overwrite previously set values."
  it("flags an earlier row overwritten by the same trigger", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+a=copy_to_clipboard", "ctrl+a=paste_from_clipboard"])
    ).toEqual([{ row: 0, kind: "overridden", byRow: 1 }]);
  });

  it("calls an exact repeat of the same action a duplicate", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+a=new_tab", "ctrl+a=NEW_TAB"])
    ).toEqual([{ row: 0, kind: "duplicate", byRow: 1 }]);
  });

  it("keeps text parameters case-sensitive when comparing actions", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+a=text:Hi", "ctrl+a=text:hi"])
    ).toEqual([{ row: 0, kind: "overridden", byRow: 1 }]);
  });

  // Reference: "Keybind triggers are not unique per prefix combination."
  it("treats flag prefixes as the same trigger", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+a=reload_config",
        "global:unconsumed:ctrl+a=toggle_quick_terminal",
      ])
    ).toEqual([{ row: 0, kind: "overridden", byRow: 1 }]);
  });

  // Reference: modifier aliases; "modifiers and keys can be in any order".
  it("normalizes modifier aliases and order", () => {
    expect(
      analyzeKeybindConflicts([
        "cmd+shift+t=new_tab",
        "t+shift+super=new_window",
        "opt+control+x=close_surface",
        "ctrl+alt+x=close_tab",
      ])
    ).toEqual([
      { row: 0, kind: "overridden", byRow: 1 },
      { row: 2, kind: "overridden", byRow: 3 },
    ]);
  });

  // Reference: "codepoint matching is case-insensitive"; Trigger.hash folds.
  it("case-folds Unicode codepoint keys", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+A=new_tab", "ctrl+a=new_window"])
    ).toEqual([{ row: 0, kind: "overridden", byRow: 1 }]);
  });

  // Reference: "`key_a` is equivalent to `KeyA`"; physical codes are distinct
  // from codepoints.
  it("matches W3C physical codes in snake or camel case, separately from codepoints", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+KeyA=new_tab",
        "ctrl+key_a=new_window",
        "ctrl+a=new_split:right",
        "ArrowUp=scroll_page_up",
        "arrow_up=scroll_page_down",
      ])
    ).toEqual([
      { row: 0, kind: "overridden", byRow: 1 },
      { row: 3, kind: "overridden", byRow: 4 },
    ]);
  });

  // Binding.zig backwards_compatible_keys: 1.1.x names map to modern keys.
  it("maps Ghostty 1.1.x key names to the keys they resolve to", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+up=scroll_page_up",
        "ctrl+arrow_up=scroll_to_top",
        "ctrl+plus=increase_font_size:1",
        "ctrl++=increase_font_size:2",
        "kp_1=new_tab",
        "numpad_1=new_window",
      ])
    ).toEqual([
      { row: 0, kind: "overridden", byRow: 1 },
      { row: 2, kind: "overridden", byRow: 3 },
      { row: 4, kind: "overridden", byRow: 5 },
    ]);
  });

  // Reference: "if ctrl+a is bound to new_window and ctrl+a>n is bound to
  // new_tab, pressing ctrl+a will do nothing."
  it("flags a binding whose trigger later starts a sequence", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+a=new_window", "ctrl+a>n=new_tab"])
    ).toEqual([{ row: 0, kind: "sequence-prefix", byRow: 1 }]);
  });

  // Reference: "if you bind ctrl+a>n and ctrl+a>t, and then bind ctrl+a
  // directly, both ctrl+a>n and ctrl+a>t will become unbound."
  it("flags sequences whose prefix is later bound directly", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+a>n=new_window",
        "ctrl+a>t=new_tab",
        "ctrl+b>n=new_split:right",
        "ctrl+a=close_surface",
      ])
    ).toEqual([
      { row: 0, kind: "prefix-rebound", byRow: 3 },
      { row: 1, kind: "prefix-rebound", byRow: 3 },
    ]);
  });

  it("extends a sequence by overriding its shorter leaf, leaving siblings effective", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+a>n=new_window", "ctrl+a>t=new_tab", "ctrl+a>n>x=close_tab"])
    ).toEqual([{ row: 0, kind: "sequence-prefix", byRow: 2 }]);
  });

  // Reference: "keybind=clear ... removes ALL keybindings up to this point";
  // Config.zig also resets every key table.
  it("flags every earlier binding, including key tables, as cleared", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+a=new_tab",
        "vim/j=scroll_page_lines:1",
        "clear",
        "ctrl+b=new_window",
      ])
    ).toEqual([
      { row: 0, kind: "cleared", byRow: 2 },
      { row: 1, kind: "cleared", byRow: 2 },
    ]);
  });

  // Reference: "<name>/ (with no binding) defines and clears a table".
  it("flags bindings removed by a key table reset, leaving other tables alone", () => {
    expect(
      analyzeKeybindConflicts([
        "vim/j=scroll_page_lines:1",
        "copy/y=copy_to_clipboard",
        "vim/",
        "vim/k=scroll_page_lines:-1",
      ])
    ).toEqual([{ row: 0, kind: "table-cleared", byRow: 2 }]);
  });

  // Reference: key tables are separate named sets of bindings.
  it("does not treat the same trigger in different tables as a conflict", () => {
    expect(
      analyzeKeybindConflicts(["j=text:j", "vim/j=scroll_page_lines:1", "vim/global:j=scroll_to_top"])
    ).toEqual([{ row: 1, kind: "overridden", byRow: 2 }]);
  });

  // Reference: unbind "Remove[s] the binding"; removing a leader removes its
  // sequences (Set.removeExact).
  it("flags bindings removed by a later unbind, including whole sequences", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+a=new_tab",
        "ctrl+b>n=new_window",
        "ctrl+b>t=new_tab",
        "ctrl+a=unbind",
        "ctrl+b=unbind",
      ])
    ).toEqual([
      { row: 0, kind: "unbound", byRow: 3 },
      { row: 1, kind: "unbound", byRow: 4 },
      { row: 2, kind: "unbound", byRow: 4 },
    ]);
  });

  // Set.parseAndPutRecurse restores a leaf prefix when a sequence unbind
  // passes through it, so nothing changes.
  it("treats unbinding a sequence under a bound prefix as a no-op", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+a=new_tab", "ctrl+a>n=unbind"])
    ).toEqual([]);
  });

  it("ignores chains, clears of unknown tables, invalid rows, and blanks", () => {
    expect(
      analyzeKeybindConflicts([
        "ctrl+a=new_window",
        "chain=goto_split:left",
        "",
        "ctrl+a+b=new_tab",
        "not a keybind",
        "Ctrl+a=new_tab",
        "other/",
      ])
    ).toEqual([]);
  });

  it("keeps slash-key bindings in the root table", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+/=new_tab", "/=new_window", "ctrl+/=close_tab"])
    ).toEqual([{ row: 0, kind: "overridden", byRow: 2 }]);
  });

  it("reports only the first thing that removed a row", () => {
    expect(
      analyzeKeybindConflicts(["ctrl+a=new_tab", "ctrl+a=new_window", "clear"])
    ).toEqual([
      { row: 0, kind: "overridden", byRow: 1 },
      { row: 1, kind: "cleared", byRow: 2 },
    ]);
  });
});

describe("describeKeybindConflict", () => {
  it("uses 1-based row numbers", () => {
    expect(describeKeybindConflict({ row: 0, kind: "overridden", byRow: 1 })).toBe(
      "No effect: row 2 binds the same trigger to a different action."
    );
    expect(describeKeybindConflict({ row: 1, kind: "cleared", byRow: 4 })).toBe(
      "No effect: removed by keybind = clear on row 5."
    );
  });
});

describe("findDefaultKeybindOverrides", () => {
  const defaults = [
    { trigger: "super+c", action: "copy_to_clipboard:mixed" },
    { trigger: "super+t", action: "new_tab" },
    { trigger: "super+d", action: "new_split:right" },
    { trigger: "super+k", action: "clear_screen" },
  ];

  it("reports defaults replaced by a different action, not rebinds to the same action", () => {
    expect(
      findDefaultKeybindOverrides(["cmd+c=paste_from_clipboard", "super+t=new_tab"], defaults)
    ).toEqual([{ row: 0, kind: "replaces", default: defaults[0] }]);
  });

  it("reports sequences that take over a default trigger", () => {
    expect(findDefaultKeybindOverrides(["super+d>r=new_split:right"], defaults)).toEqual([
      { row: 0, kind: "sequence-prefix", default: defaults[2] },
    ]);
  });

  it("reports unbinds and clear", () => {
    expect(findDefaultKeybindOverrides(["super+k=unbind", "clear"], defaults)).toEqual([
      { row: 0, kind: "unbound", default: defaults[3] },
      { row: 1, kind: "cleared", default: defaults[0] },
      { row: 1, kind: "cleared", default: defaults[1] },
      { row: 1, kind: "cleared", default: defaults[2] },
    ]);
  });

  it("attributes a displaced default to the row that finally owns its trigger", () => {
    expect(
      findDefaultKeybindOverrides(
        ["super+c=new_window", "super+c=paste_from_clipboard", "super+t>x=close_tab", "super+t=new_window"],
        defaults
      )
    ).toEqual([
      { row: 1, kind: "replaces", default: defaults[0] },
      { row: 3, kind: "replaces", default: defaults[1] },
    ]);
  });

  it("ignores key tables, which never touch the default set", () => {
    expect(findDefaultKeybindOverrides(["vim/super+c=new_tab"], defaults)).toEqual([]);
  });
});
