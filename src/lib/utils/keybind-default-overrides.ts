import { GHOSTTY_DEFAULT_KEYBINDS } from "@/data/ghostty-default-keybinds";
import {
  findDefaultKeybindOverrides,
  type DefaultKeybindOverrideKind,
} from "@/lib/utils/keybind-conflicts";
import type { GhosttyPlatform } from "@/lib/utils/ghostty-default-keybinds-extract";

const PLATFORM_LABELS: Record<GhosttyPlatform, string> = { macos: "macOS", linux: "Linux" };
const PLATFORMS: GhosttyPlatform[] = ["macos", "linux"];

const LEAD: Record<Exclude<DefaultKeybindOverrideKind, "cleared">, string> = {
  replaces: "Replaces Ghostty default",
  "sequence-prefix": "Starts a sequence on Ghostty default",
  unbound: "Removes Ghostty default",
};

/**
 * One-line notes per row describing which of Ghostty's default keybinds the
 * row changes, merged across macOS and Linux. Keys are zero-based rows.
 */
export function describeDefaultKeybindOverrides(entries: readonly string[]): Map<number, string[]> {
  // row -> "kind|trigger|action" -> platforms
  const grouped = new Map<number, Map<string, GhosttyPlatform[]>>();
  // row -> platform -> number of defaults removed by `clear`
  const cleared = new Map<number, Map<GhosttyPlatform, number>>();

  for (const platform of PLATFORMS) {
    for (const override of findDefaultKeybindOverrides(entries, GHOSTTY_DEFAULT_KEYBINDS[platform])) {
      if (override.kind === "cleared") {
        const counts = cleared.get(override.row) ?? new Map<GhosttyPlatform, number>();
        counts.set(platform, (counts.get(platform) ?? 0) + 1);
        cleared.set(override.row, counts);
        continue;
      }
      const key = `${override.kind}|${override.default.trigger}|${override.default.action}`;
      const rowGroups = grouped.get(override.row) ?? new Map<string, GhosttyPlatform[]>();
      rowGroups.set(key, [...(rowGroups.get(key) ?? []), platform]);
      grouped.set(override.row, rowGroups);
    }
  }

  const notes = new Map<number, string[]>();
  const add = (row: number, note: string) => notes.set(row, [...(notes.get(row) ?? []), note]);

  for (const [row, groups] of grouped) {
    for (const [key, platforms] of groups) {
      const [kind, trigger, action] = key.split("|") as [Exclude<DefaultKeybindOverrideKind, "cleared">, string, string];
      const where = platforms.map((platform) => PLATFORM_LABELS[platform]).join(", ");
      add(row, `${LEAD[kind]} ${trigger} → ${action} (${where}).`);
    }
  }
  for (const [row, counts] of cleared) {
    const parts = PLATFORMS.filter((platform) => counts.has(platform)).map(
      (platform) => `${counts.get(platform)} on ${PLATFORM_LABELS[platform]}`
    );
    add(row, `Removes Ghostty's default keybinds (${parts.join(", ")}).`);
  }

  return new Map([...notes].sort(([a], [b]) => a - b));
}
