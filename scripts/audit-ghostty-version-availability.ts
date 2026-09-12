#!/usr/bin/env bun

/**
 * Audit Ghostty option version availability against upstream Config.zig history.
 *
 * For every local option ID, finds the Config.zig commit that introduced the
 * field (git pickaxe) and maps it to the earliest containing v1.* release tag.
 * Compares the result with the local `sinceVersion` metadata (absent means the
 * Ghostty 1.0 baseline) and flags deprecation candidates from the official
 * config reference prose.
 *
 * Read-only with respect to both repositories. Results are cached in the
 * (git-ignored) local-docs directory; pass --refresh to redo the upstream walk.
 *
 * Usage:
 *   bun run scripts/audit-ghostty-version-availability.ts [--refresh] [--limit N]
 *
 * Environment:
 *   GHOSTTY_CLONE  path to a ghostty-org/ghostty checkout with v1.* tags
 *                  (default: ~/.cache/spectre-audit/ghostty)
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
import { allOptions } from "../src/data/ghostty-options";
import { GHOSTTY_CONFIG_REFERENCE_URL } from "../src/lib/utils/schema-drift";

const CLONE =
  process.env.GHOSTTY_CLONE ?? join(homedir(), ".cache", "spectre-audit", "ghostty");
const CACHE_PATH = join(SCRIPTS_DIR, "..", "local-docs", "version-audit.cache.json");
const REPORT_PATH = join(SCRIPTS_DIR, "..", "local-docs", "version-audit.md");

interface AuditEntry {
  id: string;
  local: string;
  upstream: string | null;
  commit: string | null;
  commitDate: string | null;
  status: "match" | "mismatch" | "unknown";
}

interface CachedUpstream {
  upstream: string | null;
  commit: string | null;
  commitDate: string | null;
}

function runGit(args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: CLONE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`git ${args.join(" ")} failed: ${message.slice(0, 300)}`);
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function introductionCommit(pattern: string): { commit: string; date: string } | null {
  // -G matches added/removed diff lines against a regex. Anchored to column 0
  // so only top-level field definitions match, never comments, string
  // literals, or nested function parameters (e.g. parseCLI(input: ...)).
  const out = runGit([
    "log",
    "--reverse",
    "--format=%H|%cs",
    "-G",
    pattern,
    "--",
    "src/config/Config.zig",
  ]);
  const first = out.split("\n").find((line) => line.includes("|"));
  if (!first) return null;
  const [commit, date] = first.split("|");
  return { commit, date };
}

function earliestTag(commit: string): string | null {
  const out = runGit(["tag", "--contains", commit]);
  const tags = out
    .split("\n")
    .map((t) => t.trim())
    .filter((t) => /^v1\.\d+\.\d+$/.test(t))
    .map((t) => t.slice(1))
    .sort(compareVersions);
  return tags[0] ?? null;
}

function lookupUpstream(id: string): CachedUpstream {
  const snake = id.replace(/-/g, "_");
  // Upstream Config.zig declares every public option as a column-0 field,
  // either quoted kebab-case (@"progress-style": bool) or bare identifiers
  // (background: Color). Verified: all 202 local IDs resolve at column 0
  // in the v1.3.1 snapshot.
  const q = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [`^@"${q(id)}":`, `^${q(snake)}:`];

  let best: { commit: string; date: string } | null = null;
  for (const pattern of patterns) {
    const found = introductionCommit(pattern);
    if (found && (!best || found.date < best.date)) best = found;
  }

  if (!best) return { upstream: null, commit: null, commitDate: null };
  const upstream = earliestTag(best.commit);
  if (!upstream) {
    return { upstream: null, commit: best.commit.slice(0, 12), commitDate: best.date };
  }
  return { upstream, commit: best.commit.slice(0, 12), commitDate: best.date };
}

function auditOption(id: string, found: CachedUpstream): AuditEntry {
  const local = allOptions.find((o) => o.id === id)?.sinceVersion ?? "1.0.0";
  if (!found.upstream) {
    return { id, local, upstream: null, commit: found.commit, commitDate: found.commitDate, status: "unknown" };
  }
  return {
    id,
    local,
    upstream: found.upstream,
    commit: found.commit,
    commitDate: found.commitDate,
    status: found.upstream === local ? "match" : "mismatch",
  };
}

async function deprecationCandidates(): Promise<string[]> {
  const response = await fetch(GHOSTTY_CONFIG_REFERENCE_URL, {
    headers: { Accept: "text/html", "User-Agent": "spectre-ghostty-config-version-audit" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Reference fetch failed: ${response.status}`);
  const html = await response.text();
  const found: string[] = [];
  for (const option of allOptions) {
    const anchor = html.indexOf(`id="${option.id}"`);
    if (anchor === -1) continue;
    // Attribute a deprecation note only when the option's own id appears in
    // the same sentence (e.g. "bold-is-bright is deprecated" must not flag
    // the neighboring bold-color section that merely references it).
    const window = html.slice(Math.max(0, anchor - 500), anchor + 2500);
    const sentenced = window
      .replace(/<[^>]+>/g, " ")
      .split(/[.!?]+/)
      .some((sentence) => /deprecat/i.test(sentence) && sentence.includes(option.id));
    if (sentenced) found.push(option.id);
  }
  return found;
}

async function main() {
  const refresh = process.argv.includes("--refresh");
  const limitFlag = process.argv.indexOf("--limit");
  const limitArg = limitFlag === -1 ? Number.NaN : Number(process.argv[limitFlag + 1]);
  if (limitFlag !== -1 && !Number.isInteger(limitArg)) {
    throw new Error("Usage: audit-ghostty-version-availability.ts [--refresh] [--limit N]");
  }
  const limit = limitFlag === -1 ? Number.POSITIVE_INFINITY : limitArg;

  // The cache stores upstream findings only; the local comparison is always
  // fresh, so schema edits never require re-walking upstream history.
  // Older caches holding full entries are migrated on read.
  let upstreamCache: Record<string, CachedUpstream> = {};
  if (!refresh && existsSync(CACHE_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(CACHE_PATH, "utf8")) as Record<string, AuditEntry & CachedUpstream>;
      for (const [id, entry] of Object.entries(raw)) {
        upstreamCache[id] = {
          upstream: entry.upstream ?? null,
          commit: entry.commit ?? null,
          commitDate: entry.commitDate ?? null,
        };
      }
    } catch {
      upstreamCache = {};
    }
  }
  const writeCache = (found: Record<string, CachedUpstream>) => {
    mkdirSync(dirname(CACHE_PATH), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify({ ...upstreamCache, ...found }, null, 2));
  };

  const ids = allOptions.map((o) => o.id).slice(0, limit);
  const entries: AuditEntry[] = [];
  const walkedUpstream: Record<string, CachedUpstream> = {};
  let walked = 0;
  for (const [index, id] of ids.entries()) {
    let found = upstreamCache[id];
    if (!found || refresh) {
      found = lookupUpstream(id);
      walkedUpstream[id] = found;
      walked += 1;
      if (walked % 20 === 0) console.log(`  walked ${walked}/${ids.length}...`);
    }
    entries.push(auditOption(id, found));
    if (index % 20 === 0) writeCache(walkedUpstream);
  }
  writeCache(walkedUpstream);

  const mismatches = entries.filter((e) => e.status === "mismatch");
  const unknowns = entries.filter((e) => e.status === "unknown");
  const matches = entries.filter((e) => e.status === "match");

  console.log("Fetching reference for deprecation scan...");
  const deprecated = await deprecationCandidates();

  const lines = [
    "# Ghostty version availability audit",
    "",
    `- Generated: ${new Date().toISOString()}`,
    `- Options audited: ${entries.length}`,
    `- Match: ${matches.length}, mismatch: ${mismatches.length}, unknown: ${unknowns.length}`,
    `- Deprecation candidates in reference prose: ${deprecated.length}`,
    "",
    "Convention under test: absent local `sinceVersion` means the Ghostty 1.0 baseline.",
    "",
    "## Mismatches (local vs upstream introducing release)",
    "",
    "| option | local | upstream | commit | date |",
    "| --- | --- | --- | --- | --- |",
    ...mismatches.map((e) => `| ${e.id} | ${e.local} | ${e.upstream} | ${e.commit} | ${e.commitDate} |`),
    ...(mismatches.length === 0 ? ["(none)"] : []),
    "",
    "## Unknown (no introducing commit found)",
    "",
    ...unknowns.map((e) => `- ${e.id} (local: ${e.local})`),
    ...(unknowns.length === 0 ? ["(none)"] : []),
    "",
    "## Deprecation candidates",
    "",
    ...deprecated.map((id) => `- ${id}`),
    ...(deprecated.length === 0 ? ["(none)"] : []),
    "",
  ];
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, lines.join("\n"));
  console.log(`Match: ${matches.length}, mismatch: ${mismatches.length}, unknown: ${unknowns.length}`);
  console.log(`Deprecation candidates: ${deprecated.join(", ") || "(none)"}`);
  console.log(`Report: ${REPORT_PATH}`);
}

await main();
