import { describe, expect, it } from 'vitest';
import {
  DOCS_ONLY_REFERENCE_ANCHORS,
  createGhosttySchemaDriftReport,
  extractGhosttyConfigSourceOptionIds,
  extractGhosttyReferenceAnchorIds,
  findReferenceLag,
  formatGhosttySchemaDriftReport,
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

  it('extracts public top-level option fields from Ghostty Config.zig source', () => {
    const source = `
/// Main config fields.
language: ?[:0]const u8 = null,
@"font-family": RepeatableString = .{},
background: Color = .{},
@"font-family": RepeatableString = .{},
@"_xdg-terminal-exec": bool = false,

pub const Nested = struct {
    nested_field: bool = false,
};
    indented_local: bool = false,
`;

    expect(extractGhosttyConfigSourceOptionIds(source)).toEqual([
      'language',
      'font-family',
      'background',
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

  it('resolves aliased reference anchor ids back to their real option id', () => {
    const report = createGhosttySchemaDriftReport({
      referenceAnchorIds: ['font-family', 'shell-integration-3', 'shell-integration-features'],
      localOptionIds: ['font-family', 'shell-integration', 'shell-integration-features'],
      docsOnlyAnchorIds: [],
      referenceAnchorIdAliases: { 'shell-integration-3': 'shell-integration' },
    });

    expect(report.ok).toBe(true);
    expect(report.referenceOptionIds).toEqual([
      'font-family',
      'shell-integration',
      'shell-integration-features',
    ]);
    expect(report.missingLocalOptionIds).toEqual([]);
    expect(report.extraLocalOptionIds).toEqual([]);
    expect(report.staleReferenceAnchorIdAliases).toEqual([]);
  });

  it('fails when the anchor id alias map contains stale entries', () => {
    const report = createGhosttySchemaDriftReport({
      referenceAnchorIds: ['font-family', 'shell-integration'],
      localOptionIds: ['font-family', 'shell-integration'],
      docsOnlyAnchorIds: [],
      referenceAnchorIdAliases: { 'shell-integration-3': 'shell-integration' },
    });

    expect(report.ok).toBe(false);
    expect(report.staleReferenceAnchorIdAliases).toEqual(['shell-integration-3']);
  });
});

// ghostty.org can lag behind a Ghostty release. That shows up as options Spectre has and the site doesn't
// (new in the release) and old names the site still lists (renamed in the release). It is not drift.
describe('findReferenceLag', () => {
  const localOptions = [
    { id: 'font-family' },
    { id: 'link-osc8', sinceVersion: '1.4.0' },
    { id: 'drag-handle', sinceVersion: '1.4.0' },
    { id: 'scrollback-limit-bytes', renamed: { from: 'scrollback-limit', in: '1.4.0' } },
    { id: 'quick-terminal-size', sinceVersion: '1.2.0' },
  ];
  const ids = localOptions.map((option) => option.id);
  const report = (referenceAnchorIds: string[], localOptionIds = ids) =>
    createGhosttySchemaDriftReport({ referenceAnchorIds, localOptionIds, docsOnlyAnchorIds: [], referenceAnchorIdAliases: {} });

  it('explains a site that has not published the stable release yet', () => {
    const lag = findReferenceLag(report(['font-family', 'scrollback-limit', 'quick-terminal-size']), localOptions, '1.4.0');

    expect(lag).toEqual({
      stableVersion: '1.4.0',
      newOptionIds: ['link-osc8', 'drag-handle', 'scrollback-limit-bytes'],
      oldNameIds: ['scrollback-limit'],
    });
  });

  it('still explains it once the stable target is a patch release of that line', () => {
    expect(findReferenceLag(report(['font-family', 'scrollback-limit', 'quick-terminal-size']), localOptions, '1.4.2')).not.toBeNull();
  });

  it('is null when the site matches', () => {
    expect(findReferenceLag(report(ids), localOptions, '1.4.0')).toBeNull();
  });

  it('is null when the site has published the release but lacks one of its options, which may have been removed', () => {
    expect(
      findReferenceLag(report(['font-family', 'link-osc8', 'scrollback-limit-bytes', 'quick-terminal-size']), localOptions, '1.4.0')
    ).toBeNull();
  });

  it('is null when the site lists a name a newer release took away without a rename', () => {
    expect(
      findReferenceLag(report(['font-family', 'scrollback-limit', 'removed-option', 'quick-terminal-size']), localOptions, '1.4.0')
    ).toBeNull();
  });

  it('is null when the site lacks an option older than the stable release, so it may have been removed', () => {
    expect(findReferenceLag(report(['scrollback-limit', 'link-osc8', 'drag-handle']), localOptions, '1.4.0')).toBeNull();
  });

  it('is null when the site lists an option Spectre does not have', () => {
    expect(
      findReferenceLag(report([...ids, 'scrollback-limit', 'brand-new-option']), localOptions, '1.4.0')
    ).toBeNull();
  });

  it('is null once the release the site lacks is no longer the stable line', () => {
    expect(findReferenceLag(report(['font-family', 'scrollback-limit', 'quick-terminal-size']), localOptions, '1.5.0')).toBeNull();
  });

  it('is null when the docs-only allowlist or an alias is stale, whatever else differs', () => {
    const stale = createGhosttySchemaDriftReport({
      referenceAnchorIds: ['font-family', 'scrollback-limit', 'quick-terminal-size'],
      localOptionIds: ids,
      docsOnlyAnchorIds: ['key-tables'],
      referenceAnchorIdAliases: {},
    });
    expect(findReferenceLag(stale, localOptions, '1.4.0')).toBeNull();
  });

  it('says in the report that a lagging site is not drift', () => {
    const lagging = report(['font-family', 'scrollback-limit', 'quick-terminal-size']);
    const text = formatGhosttySchemaDriftReport(lagging, findReferenceLag(lagging, localOptions, '1.4.0'));

    expect(text).toContain('Result: REFERENCE BEHIND GHOSTTY 1.4.0');
    expect(text).not.toContain('DRIFT DETECTED');
    expect(formatGhosttySchemaDriftReport(lagging)).toContain('Result: DRIFT DETECTED');
  });
});
