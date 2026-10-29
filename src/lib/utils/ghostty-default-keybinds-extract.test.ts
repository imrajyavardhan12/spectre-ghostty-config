import { describe, expect, it } from "vitest";
import {
  evaluateGhosttyDefaultKeybinds,
  extractActionDefaultParams,
  extractKeybindsInitBody,
  resolveDefaultActionParams,
} from "@/lib/utils/ghostty-default-keybinds-extract";
import { GHOSTTY_DEFAULT_KEYBINDS } from "@/data/ghostty-default-keybinds";

// A trimmed Keybinds.init using every construct the evaluator supports.
const SOURCE = `
pub const Keybinds = struct {
    pub fn init(self: *Keybinds, alloc: Allocator) !void {
        // it's the arena, don't free
        self.set = .{};
        try self.set.put(
            alloc,
            .{ .key = .{ .unicode = ',' }, .mods = inputpkg.ctrlOrSuper(.{ .shift = true }) },
            .{ .reload_config = {} },
        );
        {
            try self.set.put(alloc, .{ .key = .{ .physical = .copy } }, .{ .copy_to_clipboard = .mixed });
            if (!builtin.target.os.tag.isDarwin()) {
                try self.set.put(alloc, .{ .key = .{ .physical = .insert }, .mods = .{ .ctrl = true } }, .{ .copy_to_clipboard = .mixed });
            }
            const mods: inputpkg.Mods = if (builtin.target.os.tag.isDarwin())
                .{ .super = true }
            else
                .{ .ctrl = true, .shift = true };
            try self.set.putFlags(alloc, .{ .key = .{ .unicode = 'c' }, .mods = mods }, .{ .copy_to_clipboard = .mixed }, .{ .performable = true });
        }
        if (comptime !builtin.target.os.tag.isDarwin()) {
            try self.set.put(alloc, .{ .key = .{ .unicode = 'w' }, .mods = .{ .ctrl = true, .shift = true } }, .{ .close_surface = {} });
            try self.set.put(alloc, .{ .key = .{ .unicode = 'w' }, .mods = .{ .ctrl = true, .shift = true } }, .{ .close_tab = .this });
            try self.set.put(alloc, .{ .key = .{ .physical = .arrow_up }, .mods = .{ .super = true, .ctrl = true, .shift = true } }, .{ .resize_split = .{ .up, 10 } });
        }
        {
            const mods: inputpkg.Mods = if (builtin.target.os.tag.isDarwin()) .{ .super = true } else .{ .alt = true };
            const start: u21 = '1';
            const end: u21 = '2';
            comptime var i: u21 = start;
            inline while (i <= end) : (i += 1) {
                try self.set.putFlags(
                    alloc,
                    .{ .key = .{ .physical = @field(inputpkg.Key, std.fmt.comptimePrint("digit_{u}", .{i})) }, .mods = mods },
                    .{ .goto_tab = (i - start) + 1 },
                    .{ .performable = !builtin.target.os.tag.isDarwin() },
                );
                try self.set.putFlags(alloc, .{ .key = .{ .unicode = i }, .mods = mods }, .{ .goto_tab = (i - start) + 1 }, .{ .performable = true });
            }
        }
        if (comptime builtin.target.os.tag.isDarwin()) {
            try self.set.put(alloc, .{ .key = .{ .physical = .backspace }, .mods = .{ .super = true } }, .{ .text = "\\\\x15" });
            try self.set.put(alloc, .{ .key = .{ .physical = .arrow_up }, .mods = .{ .super = true, .shift = true } }, .{ .jump_to_prompt = -1 });
            try self.set.put(alloc, .{ .key = .{ .unicode = 'p' }, .mods = .{ .super = true } }, .toggle_command_palette);
        }
    }
};
`;

describe("evaluateGhosttyDefaultKeybinds", () => {
  const body = extractKeybindsInitBody(SOURCE);

  it("evaluates macOS branches, loops, and parameter forms", () => {
    expect(evaluateGhosttyDefaultKeybinds(body, "macos")).toEqual([
      { trigger: "shift+super+,", action: "reload_config" },
      { trigger: "copy", action: "copy_to_clipboard:mixed" },
      { trigger: "super+c", action: "copy_to_clipboard:mixed" },
      { trigger: "super+digit_1", action: "goto_tab:1" },
      { trigger: "super+1", action: "goto_tab:1" },
      { trigger: "super+digit_2", action: "goto_tab:2" },
      { trigger: "super+2", action: "goto_tab:2" },
      { trigger: "super+backspace", action: "text:\\x15" },
      { trigger: "shift+super+arrow_up", action: "jump_to_prompt:-1" },
      { trigger: "super+p", action: "toggle_command_palette" },
    ]);
  });

  it("evaluates Linux branches and keeps the last binding for a trigger", () => {
    expect(evaluateGhosttyDefaultKeybinds(body, "linux")).toEqual([
      { trigger: "ctrl+shift+,", action: "reload_config" },
      { trigger: "copy", action: "copy_to_clipboard:mixed" },
      { trigger: "ctrl+insert", action: "copy_to_clipboard:mixed" },
      { trigger: "ctrl+shift+c", action: "copy_to_clipboard:mixed" },
      { trigger: "ctrl+shift+w", action: "close_tab:this" },
      { trigger: "ctrl+shift+super+arrow_up", action: "resize_split:up,10" },
      { trigger: "alt+digit_1", action: "goto_tab:1" },
      { trigger: "alt+1", action: "goto_tab:1" },
      { trigger: "alt+digit_2", action: "goto_tab:2" },
      { trigger: "alt+2", action: "goto_tab:2" },
    ]);
  });

  it("fails loudly on constructs it does not understand", () => {
    const unknown = SOURCE.replace("self.set = .{};", "self.set = .{};\n        for (keys) |k| {}");
    expect(() => evaluateGhosttyDefaultKeybinds(extractKeybindsInitBody(unknown), "macos")).toThrow(
      /Unsupported statement/
    );
    const newMods = SOURCE.replace(".{ .ctrl = true } }, .{ .copy", ".{ .hyper = true } }, .{ .copy");
    expect(() => evaluateGhosttyDefaultKeybinds(extractKeybindsInitBody(newMods), "linux")).toThrow(
      /Unsupported modifier field/
    );
  });
});

describe("GHOSTTY_DEFAULT_KEYBINDS (generated from Ghostty v1.4.0)", () => {
  const find = (platform: "macos" | "linux", trigger: string) =>
    GHOSTTY_DEFAULT_KEYBINDS[platform].find((binding) => binding.trigger === trigger)?.action;

  it("uses super on macOS and ctrl+shift on Linux for copy and paste", () => {
    expect(find("macos", "super+c")).toBe("copy_to_clipboard:mixed");
    expect(find("linux", "ctrl+shift+c")).toBe("copy_to_clipboard:mixed");
    expect(find("linux", "ctrl+shift+v")).toBe("paste_from_clipboard");
    expect(find("macos", "ctrl+shift+c")).toBeUndefined();
  });

  it("has one entry per trigger on each platform", () => {
    for (const platform of ["macos", "linux"] as const) {
      const triggers = GHOSTTY_DEFAULT_KEYBINDS[platform].map((binding) => binding.trigger);
      expect(new Set(triggers).size).toBe(triggers.length);
    }
    expect(GHOSTTY_DEFAULT_KEYBINDS.macos).toHaveLength(93);
    expect(GHOSTTY_DEFAULT_KEYBINDS.linux).toHaveLength(74);
  });
});

describe("extractActionDefaultParams", () => {
  it("maps actions to the default declared on their parameter type", () => {
    const source = `
pub const Action = union(enum) {
    // copy with a format
    copy_to_clipboard: CopyToClipboard,
    close_tab: CloseTabMode,
    goto_tab: usize,
    new_split: SplitDirection,

    pub const CopyToClipboard = enum {
        plain,
        mixed,
        // it's the default
        pub const default: CopyToClipboard = .mixed;
    };
    pub const CloseTabMode = enum {
        this,
        other,
        pub const default: CloseTabMode = .this;
    };
    pub const SplitDirection = enum { right, down };
};
`;
    expect(extractActionDefaultParams(source)).toEqual({ copy_to_clipboard: "mixed", close_tab: "this" });
  });

  it("matches the generated table for Ghostty 1.4.0", async () => {
    const { GHOSTTY_ACTION_DEFAULT_PARAMS } = await import("@/data/ghostty-default-keybinds");
    expect(GHOSTTY_ACTION_DEFAULT_PARAMS).toEqual({
      copy_to_clipboard: "mixed",
      new_split: "auto",
      open_config: "os_open",
      close_tab: "this",
    });
  });
});

describe("resolveDefaultActionParams", () => {
  const defaults = { open_config: "os_open", copy_to_clipboard: "mixed" };

  it("spells out a parameter written as .default", () => {
    expect(
      resolveDefaultActionParams(
        [
          { trigger: "ctrl+,", action: "open_config:default" },
          { trigger: "ctrl+shift+c", action: "copy_to_clipboard:mixed" },
          { trigger: "ctrl+t", action: "new_tab" },
          { trigger: "ctrl+x", action: "unknown_action:default" },
        ],
        defaults
      )
    ).toEqual([
      { trigger: "ctrl+,", action: "open_config:os_open" },
      { trigger: "ctrl+shift+c", action: "copy_to_clipboard:mixed" },
      { trigger: "ctrl+t", action: "new_tab" },
      { trigger: "ctrl+x", action: "unknown_action:default" },
    ]);
  });

  it("makes the generated open_config defaults match what a bare open_config means", () => {
    for (const platform of ["macos", "linux"] as const) {
      const bindings = GHOSTTY_DEFAULT_KEYBINDS[platform].filter((binding) => binding.action.startsWith("open_config"));
      expect(bindings).toHaveLength(1);
      expect(bindings[0].action).toBe("open_config:os_open");
    }
  });
});
