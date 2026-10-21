import type { ConfigOption } from "@/lib/schema/types";

/** What the palette suggests before anything is typed. */
export const SUGGESTED_OPTION_IDS = [
  "font-size",
  "theme",
  "cursor-style",
  "keybind",
  "macos-icon",
  "background-opacity",
];

export const MAX_SEARCH_RESULTS = 8;

/**
 * Options matching every word of the query, best first: the exact key or name, then a key or
 * name that starts with the query, then any key or name match, then description-only matches.
 * A word can appear in the name, the key or the description. Ties keep the catalog's order.
 */
export function searchOptions(
  options: ConfigOption[],
  query: string,
  limit = MAX_SEARCH_RESULTS
): { results: ConfigOption[]; total: number } {
  const text = query.trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    const results = SUGGESTED_OPTION_IDS.flatMap((id) => options.find((o) => o.id === id) ?? []);
    return { results, total: results.length };
  }

  const matches: Array<{ option: ConfigOption; rank: number }> = [];
  for (const option of options) {
    const id = option.id.toLowerCase();
    const name = option.name.toLowerCase();
    const title = `${name} ${id}`;
    const all = `${title} ${option.description.toLowerCase()}`;
    if (!words.every((word) => all.includes(word))) continue;

    const rank =
      id === text || name === text
        ? 0
        : id.startsWith(text) || name.startsWith(text)
          ? 1
          : words.every((word) => title.includes(word))
            ? 2
            : 3;
    matches.push({ option, rank });
  }
  // Array.prototype.sort is stable, so equal ranks stay in catalog order.
  matches.sort((a, b) => a.rank - b.rank);
  return { results: matches.slice(0, limit).map((m) => m.option), total: matches.length };
}
