export const GHOSTTY_CONFIG_REFERENCE_URL = "https://ghostty.org/docs/config/reference";

// These anchors are documentation sections inside the config reference, not
// Ghostty configuration keys. Keep this list intentionally small so new
// upstream anchors get reviewed instead of silently ignored.
export const DOCS_ONLY_REFERENCE_ANCHORS = [
  "chained-actions",
  "key-tables",
] as const;

// Ghostty's docs site may disambiguate duplicate heading slugs by appending a
// numeric suffix to an anchor `id`. Map any active drifted anchor ids back to
// their real option ids here. Keep this list intentionally small, documented,
// and temporary: stale aliases deliberately fail the drift check.
export const REFERENCE_ANCHOR_ID_ALIASES: Readonly<Record<string, string>> = {};

const CONFIG_REFERENCE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const ID_ATTRIBUTE_PATTERN = /\bid=(['"])(.*?)\1/;
const QUOTED_CONFIG_FIELD_PATTERN = /^@"([^"]+)"\s*:/;
const PLAIN_CONFIG_FIELD_PATTERN = /^([a-z][a-z0-9-]*)\s*:/;

export interface GhosttySchemaDriftReport {
  ok: boolean;
  referenceAnchorIds: string[];
  referenceOptionIds: string[];
  localOptionIds: string[];
  docsOnlyAnchorIds: string[];
  staleDocsOnlyAnchorIds: string[];
  staleReferenceAnchorIdAliases: string[];
  missingLocalOptionIds: string[];
  extraLocalOptionIds: string[];
}

export interface CreateGhosttySchemaDriftReportInput {
  referenceAnchorIds: string[];
  localOptionIds: string[];
  docsOnlyAnchorIds?: readonly string[];
  referenceAnchorIdAliases?: Readonly<Record<string, string>>;
}

function uniqueInOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const uniqueIds: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    uniqueIds.push(id);
  }

  return uniqueIds;
}

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export function extractGhosttyReferenceAnchorIds(html: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = HTML_TAG_PATTERN.exec(html)) !== null) {
    const tag = match[0];

    // Ghostty's docs render every config-reference heading through a
    // JumplinkHeader component. Scoping to those tags avoids collecting page
    // chrome/navigation ids that are not part of the reference.
    if (!tag.includes("jumplinkHeader")) {
      continue;
    }

    const idMatch = ID_ATTRIBUTE_PATTERN.exec(tag);
    if (!idMatch) continue;

    const id = decodeHtmlAttribute(idMatch[2]);
    if (CONFIG_REFERENCE_ID_PATTERN.test(id)) {
      ids.push(id);
    }
  }

  return uniqueInOrder(ids);
}

/**
 * Extract public configuration field names from Ghostty's Config.zig.
 *
 * Config fields are declared at column zero; nested helper types and local
 * fields are indented. Underscore-prefixed fields are Ghostty internals and
 * are intentionally excluded from the public schema.
 */
export function extractGhosttyConfigSourceOptionIds(source: string): string[] {
  const ids: string[] = [];

  for (const line of source.split("\n")) {
    const id =
      QUOTED_CONFIG_FIELD_PATTERN.exec(line)?.[1] ??
      PLAIN_CONFIG_FIELD_PATTERN.exec(line)?.[1];

    if (id && !id.startsWith("_")) {
      ids.push(id);
    }
  }

  return uniqueInOrder(ids);
}

export function createGhosttySchemaDriftReport({
  referenceAnchorIds,
  localOptionIds,
  docsOnlyAnchorIds = DOCS_ONLY_REFERENCE_ANCHORS,
  referenceAnchorIdAliases = REFERENCE_ANCHOR_ID_ALIASES,
}: CreateGhosttySchemaDriftReportInput): GhosttySchemaDriftReport {
  const uniqueReferenceAnchorIds = uniqueInOrder(referenceAnchorIds);
  const uniqueLocalOptionIds = uniqueInOrder(localOptionIds);
  const docsOnlyAnchorSet = new Set(docsOnlyAnchorIds);
  const referenceAnchorSet = new Set(uniqueReferenceAnchorIds);

  const docsOnlyReferenceAnchorIds = uniqueReferenceAnchorIds.filter((id) =>
    docsOnlyAnchorSet.has(id)
  );
  // Resolve known drifted anchor ids (e.g. upstream duplicate-slug
  // disambiguation) back to the option id they actually represent before
  // diffing against local option ids.
  const referenceOptionIds = uniqueReferenceAnchorIds
    .filter((id) => !docsOnlyAnchorSet.has(id))
    .map((id) => referenceAnchorIdAliases[id] ?? id);
  const referenceOptionSet = new Set(referenceOptionIds);
  const localOptionSet = new Set(uniqueLocalOptionIds);

  const missingLocalOptionIds = referenceOptionIds.filter((id) =>
    !localOptionSet.has(id)
  );
  const extraLocalOptionIds = uniqueLocalOptionIds.filter((id) =>
    !referenceOptionSet.has(id)
  );
  const staleDocsOnlyAnchorIds = docsOnlyAnchorIds.filter((id) =>
    !referenceAnchorSet.has(id)
  );
  // If an aliased anchor id no longer appears upstream, the alias is stale
  // (Ghostty likely fixed their anchor) and should be reviewed/removed.
  const staleReferenceAnchorIdAliases = Object.keys(referenceAnchorIdAliases).filter(
    (id) => !referenceAnchorSet.has(id)
  );

  return {
    ok:
      missingLocalOptionIds.length === 0 &&
      extraLocalOptionIds.length === 0 &&
      staleDocsOnlyAnchorIds.length === 0 &&
      staleReferenceAnchorIdAliases.length === 0,
    referenceAnchorIds: uniqueReferenceAnchorIds,
    referenceOptionIds,
    localOptionIds: uniqueLocalOptionIds,
    docsOnlyAnchorIds: docsOnlyReferenceAnchorIds,
    staleDocsOnlyAnchorIds,
    staleReferenceAnchorIdAliases,
    missingLocalOptionIds,
    extraLocalOptionIds,
  };
}

function formatList(ids: string[]): string {
  return ids.length === 0 ? "  none" : ids.map((id) => `  - ${id}`).join("\n");
}

export function formatGhosttySchemaDriftReport(report: GhosttySchemaDriftReport): string {
  const lines = [
    "Ghostty schema drift check",
    `Reference anchors: ${report.referenceAnchorIds.length}`,
    `Reference option ids: ${report.referenceOptionIds.length}`,
    `Local option ids: ${report.localOptionIds.length}`,
    `Docs-only anchors: ${report.docsOnlyAnchorIds.length}`,
    "",
    "Missing local options:",
    formatList(report.missingLocalOptionIds),
    "",
    "Extra local options:",
    formatList(report.extraLocalOptionIds),
  ];

  if (report.staleDocsOnlyAnchorIds.length > 0) {
    lines.push(
      "",
      "Stale docs-only allowlist entries:",
      formatList(report.staleDocsOnlyAnchorIds)
    );
  }

  if (report.staleReferenceAnchorIdAliases.length > 0) {
    lines.push(
      "",
      "Stale reference anchor id aliases:",
      formatList(report.staleReferenceAnchorIdAliases)
    );
  }

  lines.push("", report.ok ? "Result: OK" : "Result: DRIFT DETECTED");

  return lines.join("\n");
}
