import { describe, expect, it } from "vitest";
import { allOptions } from "@/data/ghostty-options";
import { MAX_SEARCH_RESULTS, SUGGESTED_OPTION_IDS, searchOptions } from "./option-search";

const visible = allOptions.filter((option) => !option.hidden);

describe("searchOptions", () => {
  it("suggests the usual starting points before anything is typed", () => {
    const { results } = searchOptions(visible, "   ");
    expect(results.map((o) => o.id)).toEqual(SUGGESTED_OPTION_IDS);
  });

  it("finds an option by its key and by its name, in any case", () => {
    expect(searchOptions(visible, "CURSOR-STYLE").results[0].id).toBe("cursor-style");
    expect(searchOptions(visible, "font size").results.map((o) => o.id)).toContain("font-size");
  });

  it("puts name and key matches ahead of description-only matches", () => {
    const { results } = searchOptions(visible, "opacity");
    const firstDescriptionOnly = results.findIndex(
      (o) => !`${o.name} ${o.id}`.toLowerCase().includes("opacity")
    );
    const lastNameMatch = results.findLastIndex((o) =>
      `${o.name} ${o.id}`.toLowerCase().includes("opacity")
    );
    if (firstDescriptionOnly !== -1) expect(lastNameMatch).toBeLessThan(firstDescriptionOnly);
    expect(results[0].id).toContain("opacity");
  });

  it("puts an exact key first, then keys that start with the query", () => {
    expect(searchOptions(visible, "theme").results[0].id).toBe("theme");
    expect(searchOptions(visible, "font-size").results[0].id).toBe("font-size");
    // Keys that start with the query lead; other matches only fill what is left.
    const prefixCount = visible.filter((o) => o.id.startsWith("cursor-")).length;
    const { results } = searchOptions(visible, "cursor-");
    expect(results.slice(0, Math.min(prefixCount, results.length)).every((o) => o.id.startsWith("cursor-"))).toBe(true);
  });

  it("requires every word, so extra words narrow the results", () => {
    const wide = searchOptions(visible, "cursor");
    const narrow = searchOptions(visible, "cursor style");
    expect(narrow.total).toBeLessThanOrEqual(wide.total);
    expect(narrow.results.every((o) => `${o.name} ${o.id} ${o.description}`.toLowerCase().includes("style"))).toBe(true);
  });

  it("caps the list but still reports how many matched", () => {
    const { results, total } = searchOptions(visible, "a");
    expect(results).toHaveLength(MAX_SEARCH_RESULTS);
    expect(total).toBeGreaterThan(MAX_SEARCH_RESULTS);
  });

  it("returns nothing for words no option has", () => {
    expect(searchOptions(visible, "blink rate zzz")).toEqual({ results: [], total: 0 });
  });
});
