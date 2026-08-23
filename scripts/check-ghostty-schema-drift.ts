#!/usr/bin/env bun

import compatibility from "../compatibility.json";
import { allOptions } from "../src/data/ghostty-options";
import {
  createGhosttySchemaDriftReport,
  extractGhosttyConfigSourceOptionIds,
  extractGhosttyReferenceAnchorIds,
  formatGhosttySchemaDriftReport,
  GHOSTTY_CONFIG_REFERENCE_URL,
} from "../src/lib/utils/schema-drift";

const GHOSTTY_STABLE_CONFIG_SOURCE_URL =
  `https://raw.githubusercontent.com/ghostty-org/ghostty/${compatibility.ghostty.configCommit}/src/config/Config.zig`;
const GHOSTTY_TAGGED_CONFIG_SOURCE_URL =
  `https://raw.githubusercontent.com/ghostty-org/ghostty/${compatibility.ghostty.tag}/src/config/Config.zig`;

async function fetchText(
  url: string,
  accept: string,
  context: string
): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "spectre-ghostty-config-schema-drift-check",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${context}: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}

function formatList(ids: string[]): string {
  return ids.length === 0 ? "  none" : ids.map((id) => `  - ${id}`).join("\n");
}

async function main() {
  const [referenceHtml, stableConfigSource, taggedConfigSource] =
    await Promise.all([
      fetchText(
        GHOSTTY_CONFIG_REFERENCE_URL,
        "text/html",
        "Ghostty config reference"
      ),
      fetchText(
        GHOSTTY_STABLE_CONFIG_SOURCE_URL,
        "text/plain",
        `Ghostty commit ${compatibility.ghostty.configCommit} Config.zig`
      ),
      fetchText(
        GHOSTTY_TAGGED_CONFIG_SOURCE_URL,
        "text/plain",
        `Ghostty tag ${compatibility.ghostty.tag} Config.zig`
      ),
    ]);

  const localOptionIds = allOptions.map((option) => option.id);
  const referenceAnchorIds = extractGhosttyReferenceAnchorIds(referenceHtml);
  const stableSourceOptionIds = extractGhosttyConfigSourceOptionIds(
    stableConfigSource
  );

  if (referenceAnchorIds.length === 0) {
    throw new Error(
      "Ghostty config reference parsing returned no anchors. The upstream docs markup may have changed."
    );
  }
  if (stableSourceOptionIds.length === 0) {
    throw new Error(
      "Ghostty Config.zig parsing returned no public fields. The upstream source layout may have changed."
    );
  }

  const referenceReport = createGhosttySchemaDriftReport({
    referenceAnchorIds,
    localOptionIds,
  });
  const stableSourceReport = createGhosttySchemaDriftReport({
    referenceAnchorIds: stableSourceOptionIds,
    localOptionIds,
    docsOnlyAnchorIds: [],
    referenceAnchorIdAliases: {},
  });
  const manifestCountMatches =
    compatibility.ghostty.publicOptionCount === stableSourceOptionIds.length &&
    compatibility.ghostty.publicOptionCount === localOptionIds.length;
  const tagSourceMatchesCommit = taggedConfigSource === stableConfigSource;
  const stableSourceOk =
    stableSourceReport.ok && manifestCountMatches && tagSourceMatchesCommit;

  console.log(formatGhosttySchemaDriftReport(referenceReport));
  console.log("");
  console.log("Ghostty stable source compatibility check");
  console.log(
    `Target: Ghostty ${compatibility.ghostty.stableVersion} (${compatibility.ghostty.tag})`
  );
  console.log(`Config commit: ${compatibility.ghostty.configCommit}`);
  console.log(
    `Tag source matches commit: ${tagSourceMatchesCommit ? "yes" : "no"}`
  );
  console.log(`Source option ids: ${stableSourceOptionIds.length}`);
  console.log(`Local option ids: ${localOptionIds.length}`);
  console.log(
    `Manifest option ids: ${compatibility.ghostty.publicOptionCount}`
  );
  console.log("");
  console.log("Missing local options:");
  console.log(formatList(stableSourceReport.missingLocalOptionIds));
  console.log("");
  console.log("Extra local options:");
  console.log(formatList(stableSourceReport.extraLocalOptionIds));
  console.log("");
  console.log(
    stableSourceOk
      ? "Result: STABLE SOURCE MATCH"
      : "Result: STABLE SOURCE DRIFT DETECTED"
  );

  if (!referenceReport.ok || !stableSourceOk) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
