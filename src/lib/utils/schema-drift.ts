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

/** The release metadata findReferenceLag needs from each local option. */
export interface LocalOptionReleaseInfo {
  id: string;
  /** Release that added the option; absent means the 1.0 baseline. */
  sinceVersion?: string;
  renamed?: { from: string; in: string };
}

/** The differences a site that hasn't caught up with the stable release explains. */
export interface ReferenceLag {
  /** The stable target whose release line the site hasn't published. */
  stableVersion: string;
  /** Options the release added or renamed, which the site doesn't list yet. */
  newOptionIds: string[];
  /** Names the release replaced, which the site still lists. */
  oldNameIds: string[];
}

const releaseLine = (version: string) => version.split(".").slice(0, 2).join(".");

/**
 * Whether the differences between the live reference and the local schema are exactly what a site
 * that hasn't published the stable release line (1.4.x for a 1.4.2 target) looks like: it lacks every
 * option that line added or renamed, and nothing else, and the only options it lists that Spectre
 * lacks are names that line replaced. A partial difference is drift, not lag: once the site lists any
 * of the line's new options it has published the release, so a missing one may have been removed.
 * Returns null for drift, and when nothing differs.
 *
 * The stable source check, which compares against the pinned Config.zig, stays the authority; this
 * only decides whether the moving website's view is drift or lag.
 */
export function findReferenceLag(
  report: GhosttySchemaDriftReport,
  localOptions: readonly LocalOptionReleaseInfo[],
  stableVersion: string
): ReferenceLag | null {
  if (report.ok) return null;
  if (report.staleDocsOnlyAnchorIds.length > 0 || report.staleReferenceAnchorIdAliases.length > 0) return null;

  const line = releaseLine(stableVersion);
  const inStableLine = (version: string | undefined) => version !== undefined && releaseLine(version) === line;

  const newInLine = new Set(
    localOptions
      .filter((option) => inStableLine(option.sinceVersion) || inStableLine(option.renamed?.in))
      .map((option) => option.id)
  );
  const replacedNames = new Set(
    localOptions.filter((option) => inStableLine(option.renamed?.in)).map((option) => option.renamed!.from)
  );
  const extra = new Set(report.extraLocalOptionIds);

  const lacksExactlyTheLine =
    newInLine.size > 0 && extra.size === newInLine.size && [...newInLine].every((id) => extra.has(id));
  const listsOnlyReplacedNames = report.missingLocalOptionIds.every((id) => replacedNames.has(id));

  return lacksExactlyTheLine && listsOnlyReplacedNames
    ? { stableVersion, newOptionIds: report.extraLocalOptionIds, oldNameIds: report.missingLocalOptionIds }
    : null;
}

function formatList(ids: string[]): string {
  return ids.length === 0 ? "  none" : ids.map((id) => `  - ${id}`).join("\n");
}

/**
 * The report as text. Pass the lag findReferenceLag found to describe a site that is behind the stable
 * release as such instead of as drift.
 */
export function formatGhosttySchemaDriftReport(
  report: GhosttySchemaDriftReport,
  lag: ReferenceLag | null = null
): string {
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

  if (!report.ok && lag) {
    lines.push(
      "",
      `Every difference is Ghostty ${lag.stableVersion} work the site hasn't published yet: options added or`,
      "renamed in that release line, and the old names it replaced. The stable source check below is the",
      "authority for the target.",
      "",
      `Result: REFERENCE BEHIND GHOSTTY ${lag.stableVersion}`
    );
  } else {
    lines.push("", report.ok ? "Result: OK" : "Result: DRIFT DETECTED");
  }

  return lines.join("\n");
}
