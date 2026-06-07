#!/usr/bin/env bun

import { allOptions } from "../src/data/ghostty-options";
import {
  createGhosttySchemaDriftReport,
  extractGhosttyReferenceAnchorIds,
  formatGhosttySchemaDriftReport,
  GHOSTTY_CONFIG_REFERENCE_URL,
} from "../src/lib/utils/schema-drift";

async function fetchGhosttyConfigReference(): Promise<string> {
  const response = await fetch(GHOSTTY_CONFIG_REFERENCE_URL, {
    headers: {
      Accept: "text/html",
      "User-Agent": "spectre-ghostty-config-schema-drift-check",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Ghostty config reference: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}

async function main() {
  const html = await fetchGhosttyConfigReference();
  const referenceAnchorIds = extractGhosttyReferenceAnchorIds(html);

  if (referenceAnchorIds.length === 0) {
    throw new Error(
      "Ghostty config reference parsing returned no anchors. The upstream docs markup may have changed."
    );
  }

  const report = createGhosttySchemaDriftReport({
    referenceAnchorIds,
    localOptionIds: allOptions.map((option) => option.id),
  });

  console.log(formatGhosttySchemaDriftReport(report));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
