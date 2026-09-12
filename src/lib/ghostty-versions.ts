import { getConfigOption } from "@/lib/utils/config-options";

/** Baseline Ghostty release: options without sinceVersion metadata date to 1.0. */
export const GHOSTTY_BASELINE_VERSION = "1.0.0";

/**
 * Ghostty stable releases that may appear as option availability or as the
 * editor target version. Source-audited in scripts/audit-ghostty-version-availability.ts.
 * When Ghostty ships a new stable release, append it here.
 */
export const GHOSTTY_RELEASES = [
  "1.0.0",
  "1.0.1",
  "1.1.0",
  "1.1.1",
  "1.1.2",
  "1.1.3",
  "1.2.0",
  "1.2.1",
  "1.2.2",
  "1.2.3",
  "1.3.0",
  "1.3.1",
] as const;

export type GhosttyRelease = (typeof GHOSTTY_RELEASES)[number];

export function isKnownGhosttyRelease(version: string): version is GhosttyRelease {
  return (GHOSTTY_RELEASES as readonly string[]).includes(version);
}

/** Numeric major.minor.patch comparison: negative when a < b, positive when a > b. */
export function compareGhosttyVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/** Release that introduced the option; absent metadata means the 1.0 baseline. */
export function getOptionIntroducedIn(optionId: string): string {
  return getConfigOption(optionId)?.sinceVersion ?? GHOSTTY_BASELINE_VERSION;
}

/**
 * Whether the option exists in the given Ghostty target version.
 * Unknown option IDs are treated as supported: absence from the schema is a
 * forward-compatibility question, not a version question.
 *
 * @param targetVersion must be a known release (see isKnownGhosttyRelease);
 *   anything else degrades to unsupported for every option.
 */
export function isOptionSupportedIn(optionId: string, targetVersion: string): boolean {
  return compareGhosttyVersions(targetVersion, getOptionIntroducedIn(optionId)) >= 0;
}
