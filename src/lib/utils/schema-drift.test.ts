import { describe, expect, it } from 'vitest';
import {
  DOCS_ONLY_REFERENCE_ANCHORS,
  createGhosttySchemaDriftReport,
  extractGhosttyReferenceAnchorIds,
} from '@/lib/utils/schema-drift';

describe('Ghostty schema drift utilities', () => {
  it('extracts option and section anchors from Ghostty reference jumplink headers', () => {
    const html = `
      <div class="JumplinkHeader-module__hash__jumplinkHeader" id="font-family"><h2><code>font-family</code></h2></div>
      <div id="theme" class="JumplinkHeader-module__hash__jumplinkHeader"><h2><code>theme</code></h2></div>
      <div id="unrelated-navigation"></div>
      <div class="JumplinkHeader-module__hash__jumplinkHeader" id="chained-actions"><h2>Chained Actions</h2></div>
      <div class="JumplinkHeader-module__hash__jumplinkHeader" id="font-family"><h2><code>font-family</code></h2></div>
    `;

    expect(extractGhosttyReferenceAnchorIds(html)).toEqual([
      'font-family',
      'theme',
      'chained-actions',
    ]);
  });

  it('reports local schema drift while ignoring documented non-option sections', () => {
    const report = createGhosttySchemaDriftReport({
      referenceAnchorIds: ['font-family', 'theme', 'key-tables', 'new-upstream-option'],
      localOptionIds: ['font-family', 'theme', 'local-only-option'],
      docsOnlyAnchorIds: DOCS_ONLY_REFERENCE_ANCHORS,
    });

    expect(report.referenceOptionIds).toEqual([
      'font-family',
      'theme',
      'new-upstream-option',
    ]);
    expect(report.docsOnlyAnchorIds).toEqual(['key-tables']);
    expect(report.missingLocalOptionIds).toEqual(['new-upstream-option']);
    expect(report.extraLocalOptionIds).toEqual(['local-only-option']);
    expect(report.ok).toBe(false);
  });

  it('passes when local option ids match the official reference after the docs-only allowlist', () => {
    const report = createGhosttySchemaDriftReport({
      referenceAnchorIds: ['font-family', 'theme', 'chained-actions', 'key-tables'],
      localOptionIds: ['theme', 'font-family'],
      docsOnlyAnchorIds: DOCS_ONLY_REFERENCE_ANCHORS,
    });

    expect(report.ok).toBe(true);
    expect(report.missingLocalOptionIds).toEqual([]);
    expect(report.extraLocalOptionIds).toEqual([]);
    expect(report.docsOnlyAnchorIds).toEqual(['chained-actions', 'key-tables']);
  });

  it('fails when the docs-only allowlist contains stale entries', () => {
    const report = createGhosttySchemaDriftReport({
      referenceAnchorIds: ['font-family', 'theme'],
      localOptionIds: ['font-family', 'theme'],
      docsOnlyAnchorIds: ['removed-docs-section'],
    });

    expect(report.ok).toBe(false);
    expect(report.staleDocsOnlyAnchorIds).toEqual(['removed-docs-section']);
  });
});
