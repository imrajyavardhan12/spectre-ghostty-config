import { describe, expect, it } from 'vitest';
import { analyzeGhosttyConfig } from '@/lib/utils/config-import-analysis';

describe('analyzeGhosttyConfig', () => {
  it('describes a valid config without applying it', () => {
    const analysis = analyzeGhosttyConfig(`
# Existing Ghostty config
font-size = 16
font-family = "JetBrains Mono"
cursor-style = bar
`);

    expect(analysis.candidateConfig).toEqual({
      'font-size': 16,
      'font-family': 'JetBrains Mono',
      'cursor-style': 'bar',
    });
    expect(analysis.normalizedConfig).toEqual(analysis.candidateConfig);
    expect(analysis.instructions).toEqual([
      {
        lineNumber: 3,
        key: 'font-size',
        rawValue: '16',
        normalizedValue: 16,
        disposition: 'retained',
        known: true,
      },
      {
        lineNumber: 4,
        key: 'font-family',
        rawValue: '"JetBrains Mono"',
        normalizedValue: 'JetBrains Mono',
        disposition: 'retained',
        known: true,
      },
      {
        lineNumber: 5,
        key: 'cursor-style',
        rawValue: 'bar',
        normalizedValue: 'bar',
        disposition: 'retained',
        known: true,
      },
    ]);
    expect(analysis.diagnostics).toEqual([]);
    expect(analysis.summary).toEqual({
      acceptedInstructionCount: 3,
      effectiveInstructionCount: 3,
      skippedLineCount: 0,
      resultingSettingCount: 3,
    });
    expect(analysis.hasMeaningfulInstruction).toBe(true);
  });

  it('keeps explicit reset/default intent meaningful when the stored diff is empty', () => {
    const analysis = analyzeGhosttyConfig(`
font-size = 13
cursor-style =
`);

    expect(analysis.candidateConfig).toEqual({ 'font-size': 13 });
    expect(analysis.normalizedConfig).toEqual({});
    expect(analysis.instructions.map((instruction) => instruction.disposition)).toEqual([
      'retained',
      'reset',
    ]);
    expect(analysis.summary.resultingSettingCount).toBe(0);
    expect(analysis.hasMeaningfulInstruction).toBe(true);
  });

  it('cannot apply a file with no meaningful instruction', () => {
    const analysis = analyzeGhosttyConfig(`
# Comment only
not an instruction
`);

    expect(analysis.candidateConfig).toEqual({});
    expect(analysis.normalizedConfig).toEqual({});
    expect(analysis.diagnostics).toEqual([
      {
        code: 'malformed-line',
        severity: 'warning',
        lineNumber: 3,
        message: 'Expected key = value syntax.',
      },
    ]);
    expect(analysis.summary.skippedLineCount).toBe(1);
    expect(analysis.hasMeaningfulInstruction).toBe(false);
  });
});
