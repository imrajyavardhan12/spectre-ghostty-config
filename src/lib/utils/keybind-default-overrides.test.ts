import { describe, expect, it } from "vitest";
import { describeDefaultKeybindOverrides } from "@/lib/utils/keybind-default-overrides";

describe("describeDefaultKeybindOverrides", () => {
  it("names the replaced default and the platform it applies to", () => {
    expect(describeDefaultKeybindOverrides(["super+c=paste_from_clipboard"])).toEqual(
      new Map([[0, ["Replaces Ghostty default super+c → copy_to_clipboard:mixed (macOS)."]]])
    );
    expect(describeDefaultKeybindOverrides(["ctrl+shift+c=new_tab"])).toEqual(
      new Map([[0, ["Replaces Ghostty default ctrl+shift+c → copy_to_clipboard:mixed (Linux)."]]])
    );
  });

  it("merges a default shared by both platforms", () => {
    expect(describeDefaultKeybindOverrides(["ctrl+tab=new_window"])).toEqual(
      new Map([[0, ["Replaces Ghostty default ctrl+tab → next_tab (macOS, Linux)."]]])
    );
  });

  it("describes sequences and unbinds", () => {
    expect(describeDefaultKeybindOverrides(["super+t>n=new_tab", "ctrl+shift+w=unbind"])).toEqual(
      new Map([
        [0, ["Starts a sequence on Ghostty default super+t → new_tab (macOS)."]],
        [1, ["Removes Ghostty default ctrl+shift+w → close_tab:this (Linux)."]],
      ])
    );
  });

  it("counts only the defaults a clear actually removes", () => {
    expect(describeDefaultKeybindOverrides(["clear"])).toEqual(
      new Map([[0, ["Removes Ghostty's default keybinds (93 on macOS, 72 on Linux)."]]])
    );
    // The unbind already removed one Linux default; the sequence row is
    // itself cleared, so its default is attributed to the clear.
    expect(
      describeDefaultKeybindOverrides(["super+t>n=new_tab", "ctrl+shift+w=unbind", "clear"])
    ).toEqual(
      new Map([
        [1, ["Removes Ghostty default ctrl+shift+w → close_tab:this (Linux)."]],
        [2, ["Removes Ghostty's default keybinds (93 on macOS, 71 on Linux)."]],
      ])
    );
  });

  it("stays quiet for bindings that change no default", () => {
    expect(describeDefaultKeybindOverrides(["ctrl+alt+shift+super+x=new_tab", "super+c=copy_to_clipboard:mixed"])).toEqual(
      new Map()
    );
  });
});
