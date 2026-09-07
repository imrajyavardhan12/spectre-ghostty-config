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

  it('normalizes unknown option values as unverified safe candidate data', () => {
    const analysis = analyzeGhosttyConfig(`
future-command = left=right
future-double = "double = value"
future-single = 'single = value'
future-empty =
future-quoted-empty = ""
future-unmatched = "literal
future-unmatched-single = '
`);

    expect(analysis.candidateConfig).toEqual({
      'future-command': 'left=right',
      'future-double': 'double = value',
      'future-single': 'single = value',
      'future-empty': '',
      'future-quoted-empty': '',
      'future-unmatched': '"literal',
      'future-unmatched-single': "'",
    });
    expect(Object.getPrototypeOf(analysis.candidateConfig)).toBeNull();
    expect(Object.getPrototypeOf(analysis.normalizedConfig)).toBeNull();
    expect(analysis.diagnostics).toHaveLength(7);
    expect(analysis.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unknown-option',
          severity: 'warning',
          lineNumber: 2,
          key: 'future-command',
        }),
      ])
    );
    expect(analysis.instructions.every((instruction) => !instruction.known)).toBe(true);
  });

  it('retains the last repeated unknown value and reports every related line', () => {
    const analysis = analyzeGhosttyConfig(`
future-option = first
future-option = "second = value"
future-option =
`);

    expect(analysis.candidateConfig['future-option']).toBe('');
    expect(
      analysis.instructions.map((instruction) => instruction.disposition)
    ).toEqual(['overridden', 'overridden', 'retained']);
    expect(analysis.summary).toMatchObject({
      acceptedInstructionCount: 3,
      effectiveInstructionCount: 1,
      skippedLineCount: 0,
      resultingSettingCount: 1,
    });

    const unknownDiagnostics = analysis.diagnostics.filter(
      (diagnostic) => diagnostic.code === 'unknown-option'
    );
    expect(unknownDiagnostics).toHaveLength(1);
    expect(unknownDiagnostics[0]).toMatchObject({
      lineNumber: 4,
      relatedLineNumbers: [2, 3],
    });
  });

  it('handles many repeated unknown options with one effective value', () => {
    const source = Array.from(
      { length: 10_000 },
      (_, index) => `future-option = value-${index}`
    ).join('\n');

    const analysis = analyzeGhosttyConfig(source);

    expect(analysis.candidateConfig['future-option']).toBe('value-9999');
    expect(analysis.instructions).toHaveLength(10_000);
    expect(analysis.instructions[0].disposition).toBe('overridden');
    expect(analysis.instructions[9_999].disposition).toBe('retained');
    expect(analysis.diagnostics).toHaveLength(1);
    expect(analysis.diagnostics[0].relatedLineNumbers).toHaveLength(9_999);
    expect(analysis.diagnostics[0].relatedLineNumbers?.[0]).toBe(1);
    expect(analysis.diagnostics[0].relatedLineNumbers?.[9_998]).toBe(9_999);
    expect(analysis.summary).toMatchObject({
      acceptedInstructionCount: 10_000,
      effectiveInstructionCount: 1,
      skippedLineCount: 0,
      resultingSettingCount: 1,
    });
  });

  it('rejects unsafe or non-Ghostty unknown option names', () => {
    const analysis = analyzeGhosttyConfig(`
__proto__ = polluted
constructor = polluted
prototype = polluted
toString = polluted
future_option = invalid
Future-option = invalid
future--option = invalid
-future = invalid
future- = invalid
 = missing
future-option-2 = retained
`);

    expect(analysis.candidateConfig).toEqual({
      'future-option-2': 'retained',
    });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(
      analysis.diagnostics.filter(
        (diagnostic) => diagnostic.code === 'unsafe-option-name'
      )
    ).toHaveLength(9);
    expect(analysis.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'empty-key',
          severity: 'error',
          lineNumber: 11,
        }),
      ])
    );
    expect(
      analysis.instructions.filter(
        (instruction) => instruction.disposition === 'invalid'
      )
    ).toHaveLength(10);
    expect(analysis.summary.skippedLineCount).toBe(10);
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

  it('parses Ghostty boolean tokens exactly and rejects other values', () => {
    const trueTokens = ['1', 't', 'T', 'true'];
    const falseTokens = ['0', 'f', 'F', 'false'];

    for (const token of trueTokens) {
      expect(
        analyzeGhosttyConfig(`mouse-hide-while-typing = ${token}`).candidateConfig[
          'mouse-hide-while-typing'
        ]
      ).toBe(true);
    }
    for (const token of falseTokens) {
      expect(
        analyzeGhosttyConfig(`mouse-hide-while-typing = ${token}`).candidateConfig[
          'mouse-hide-while-typing'
        ]
      ).toBe(false);
    }

    const invalid = analyzeGhosttyConfig('mouse-hide-while-typing = yes');
    expect(invalid.candidateConfig).toEqual({});
    expect(invalid.instructions[0].disposition).toBe('invalid');
    expect(invalid.diagnostics[0]).toMatchObject({
      code: 'invalid-boolean',
      severity: 'error',
      lineNumber: 1,
      key: 'mouse-hide-while-typing',
    });
    expect(invalid.summary.skippedLineCount).toBe(1);
    expect(invalid.hasMeaningfulInstruction).toBe(false);
  });

  it('uses upstream numeric kinds and rejects partial or unsafe numbers', () => {
    expect(analyzeGhosttyConfig('font-size = 1.5e1').candidateConfig['font-size']).toBe(15);
    expect(
      analyzeGhosttyConfig('scrollback-limit = 0x10').candidateConfig[
        'scrollback-limit'
      ]
    ).toBe(16);
    expect(
      analyzeGhosttyConfig('scrollback-limit = 0o10').candidateConfig[
        'scrollback-limit'
      ]
    ).toBe(8);
    expect(
      analyzeGhosttyConfig('scrollback-limit = 0b10').candidateConfig[
        'scrollback-limit'
      ]
    ).toBe(2);
    expect(
      analyzeGhosttyConfig('window-position-x = -0x10').candidateConfig[
        'window-position-x'
      ]
    ).toBe(-16);
    expect(
      analyzeGhosttyConfig('font-thicken-strength = 255').candidateConfig[
        'font-thicken-strength'
      ]
    ).toBe(255);
    expect(
      analyzeGhosttyConfig('image-storage-limit = 4294967295').candidateConfig[
        'image-storage-limit'
      ]
    ).toBe(4294967295);
    expect(
      analyzeGhosttyConfig(
        'scrollback-limit = 9007199254740991'
      ).candidateConfig['scrollback-limit']
    ).toBe(Number.MAX_SAFE_INTEGER);

    for (const source of [
      'scrollback-limit = -1',
      'font-thicken-strength = 256',
      'window-position-x = 40000',
      'image-storage-limit = 4294967296',
      'font-size = 12abc',
      'font-size = Infinity',
      'font-size = 1e39',
    ]) {
      const analysis = analyzeGhosttyConfig(source);
      expect(analysis.candidateConfig).toEqual({});
      expect(analysis.diagnostics[0].code).toBe('invalid-number');
      expect(analysis.instructions[0].disposition).toBe('invalid');
    }

    const unsafeInteger = analyzeGhosttyConfig(
      'scrollback-limit = 9007199254740992'
    );
    expect(unsafeInteger.candidateConfig).toEqual({});
    expect(unsafeInteger.diagnostics[0]).toMatchObject({
      code: 'unsupported-number-range',
      severity: 'error',
    });
    expect(unsafeInteger.diagnostics[0].message).toMatch(/valid in Ghostty/i);
  });

  it('preserves finite f32 source values while checking f32 range', () => {
    const analysis = analyzeGhosttyConfig('font-size = 1e-50');

    expect(analysis.candidateConfig['font-size']).toBe(1e-50);
    expect(analysis.diagnostics[0].code).toBe('number-out-of-range');
  });

  it('retains finite f64 values beyond the f32 range', () => {
    const analysis = analyzeGhosttyConfig('faint-opacity = 1e39');

    expect(analysis.candidateConfig['faint-opacity']).toBe(1e39);
    expect(analysis.diagnostics[0]).toMatchObject({
      code: 'number-out-of-range',
      severity: 'warning',
    });
  });

  it('reports structured mouse multipliers as valid Ghostty syntax not yet representable by Spectre', () => {
    const analysis = analyzeGhosttyConfig(
      'mouse-scroll-multiplier = precision:0.1,discrete:3'
    );

    expect(analysis.candidateConfig).toEqual({});
    expect(analysis.diagnostics[0]).toMatchObject({
      code: 'unsupported-number-form',
      severity: 'error',
      key: 'mouse-scroll-multiplier',
    });
    expect(analysis.diagnostics[0].message).toMatch(/valid in Ghostty/i);

    for (const value of [
      'foo:1',
      'precision:bar',
      'precision:1,,discrete:3',
    ]) {
      const invalid = analyzeGhosttyConfig(
        `mouse-scroll-multiplier = ${value}`
      );
      expect(invalid.diagnostics[0].code).toBe('invalid-number');
      expect(invalid.diagnostics[0].message).not.toMatch(/valid in Ghostty/i);
    }
  });

  it('uses Ghostty mouse multiplier clamp bounds', () => {
    for (const value of ['0.05', '100']) {
      const analysis = analyzeGhosttyConfig(
        `mouse-scroll-multiplier = ${value}`
      );
      expect(analysis.diagnostics).toEqual([]);
    }

    for (const value of ['0.001', '10001']) {
      const analysis = analyzeGhosttyConfig(
        `mouse-scroll-multiplier = ${value}`
      );
      expect(analysis.diagnostics[0].code).toBe('number-out-of-range');
    }
  });

  it('retains out-of-range numbers with Ghostty clamp warnings', () => {
    const analysis = analyzeGhosttyConfig('cursor-opacity = 2');

    expect(analysis.candidateConfig['cursor-opacity']).toBe(2);
    expect(analysis.diagnostics[0]).toMatchObject({
      code: 'number-out-of-range',
      severity: 'warning',
      lineNumber: 1,
      key: 'cursor-opacity',
    });
    expect(analysis.summary.skippedLineCount).toBe(0);
  });

  it('accepts Ghostty terminal-relative colors only for supported options', () => {
    const valid = analyzeGhosttyConfig(`
cursor-color = cell-foreground
selection-background = cell-background
search-foreground = cell-background
`);
    expect(valid.candidateConfig).toEqual({
      'cursor-color': 'cell-foreground',
      'selection-background': 'cell-background',
      'search-foreground': 'cell-background',
    });

    const invalid = analyzeGhosttyConfig('background = cell-foreground');
    expect(invalid.candidateConfig).toEqual({});
    expect(invalid.diagnostics[0].code).toBe('invalid-color');
  });

  it('accepts Ghostty custom icon color lists', () => {
    const valid = analyzeGhosttyConfig(
      'macos-icon-screen-color = #112233, medium spring green, abc'
    );
    expect(valid.candidateConfig['macos-icon-screen-color']).toBe(
      '#112233, medium spring green, abc'
    );

    const invalid = analyzeGhosttyConfig(
      'macos-icon-screen-color = #112233, not-a-color'
    );
    expect(invalid.candidateConfig).toEqual({});
    expect(invalid.diagnostics[0].code).toBe('invalid-color');
  });

  it('diagnoses invalid enum, color, and duration values', () => {
    const analysis = analyzeGhosttyConfig(`
cursor-style = rainbow
background = definitely-not-a-color
resize-overlay-duration = 1.5s
`);

    expect(analysis.candidateConfig).toEqual({});
    expect(analysis.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'invalid-enum',
      'invalid-color',
      'invalid-duration',
    ]);
    expect(analysis.summary.skippedLineCount).toBe(3);
  });

  it('keeps valid settings when other known values are invalid', () => {
    const analysis = analyzeGhosttyConfig(`
font-size = 16
mouse-hide-while-typing = maybe
cursor-style = bar
`);

    expect(analysis.normalizedConfig).toEqual({
      'font-size': 16,
      'cursor-style': 'bar',
    });
    expect(analysis.summary).toMatchObject({
      acceptedInstructionCount: 2,
      effectiveInstructionCount: 2,
      skippedLineCount: 1,
      resultingSettingCount: 2,
    });
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
