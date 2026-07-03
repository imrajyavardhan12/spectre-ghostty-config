export const GHOSTTY_CONFIG_REFERENCE_URL = "https://ghostty.org/docs/config/reference";

// These anchors are documentation sections inside the config reference, not
// Ghostty configuration keys. Keep this list intentionally small so new
// upstream anchors get reviewed instead of silently ignored.
export const DOCS_ONLY_REFERENCE_ANCHORS = [
  "chained-actions",
  "key-tables",
] as const;

const CONFIG_REFERENCE_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const ID_ATTRIBUTE_PATTERN = /\bid=(['"])(.*?)\1/;

export interface GhosttySchemaDriftReport {
  ok: boolean;
  referenceAnchorIds: string[];
  referenceOptionIds: string[];
  localOptionIds: string[];
  docsOnlyAnchorIds: string[];
  staleDocsOnlyAnchorIds: string[];
  missingLocalOptionIds: string[];
  extraLocalOptionIds: string[];
}

export interface CreateGhosttySchemaDriftReportInput {
  referenceAnchorIds: string[];
  localOptionIds: string[];
  docsOnlyAnchorIds?: readonly string[];
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

export function createGhosttySchemaDriftReport({
  referenceAnchorIds,
  localOptionIds,
  docsOnlyAnchorIds = DOCS_ONLY_REFERENCE_ANCHORS,
}: CreateGhosttySchemaDriftReportInput): GhosttySchemaDriftReport {
  const uniqueReferenceAnchorIds = uniqueInOrder(referenceAnchorIds);
  const uniqueLocalOptionIds = uniqueInOrder(localOptionIds);
  const docsOnlyAnchorSet = new Set(docsOnlyAnchorIds);
  const referenceAnchorSet = new Set(uniqueReferenceAnchorIds);

  const docsOnlyReferenceAnchorIds = uniqueReferenceAnchorIds.filter((id) =>
    docsOnlyAnchorSet.has(id)
  );
  const referenceOptionIds = uniqueReferenceAnchorIds.filter((id) =>
    !docsOnlyAnchorSet.has(id)
  );
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

  return {
    ok:
      missingLocalOptionIds.length === 0 &&
      extraLocalOptionIds.length === 0 &&
      staleDocsOnlyAnchorIds.length === 0,
    referenceAnchorIds: uniqueReferenceAnchorIds,
    referenceOptionIds,
    localOptionIds: uniqueLocalOptionIds,
    docsOnlyAnchorIds: docsOnlyReferenceAnchorIds,
    staleDocsOnlyAnchorIds,
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

  lines.push("", report.ok ? "Result: OK" : "Result: DRIFT DETECTED");

  return lines.join("\n");
}
