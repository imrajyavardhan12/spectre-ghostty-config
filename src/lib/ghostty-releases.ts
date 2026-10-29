// Kept free of imports so scripts that regenerate data files can read it even when those files are stale or broken.

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
  "1.4.0",
] as const;

export type GhosttyRelease = (typeof GHOSTTY_RELEASES)[number];
