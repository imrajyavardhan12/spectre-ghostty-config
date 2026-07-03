import { describe, expect, it } from 'vitest';
import { validateConfigValue } from '@/lib/utils/config-validation';
import type { ColorOption, DurationOption, NumberOption } from '@/lib/schema/types';

const colorOption: ColorOption = {
  id: 'background',
  name: 'Background',
  description: 'Background color',
  type: 'color',
  default: '',
  category: 'colors',
};

const durationOption: DurationOption = {
  id: 'resize-overlay-duration',
  name: 'Resize Overlay Duration',
  description: 'How long to show the resize overlay.',
  type: 'duration',
  default: '750ms',
  category: 'window',
};

const numberOption: NumberOption = {
  id: 'cursor-opacity',
  name: 'Cursor Opacity',
  description: 'Opacity of the cursor.',
  type: 'number',
  default: 1,
  category: 'cursor',
  min: 0,
  max: 1,
};

describe('validateConfigValue', () => {
  it('accepts Ghostty color syntax from docs and source', () => {
    expect(validateConfigValue(colorOption, '#aabbcc').valid).toBe(true);
    expect(validateConfigValue(colorOption, 'aabbcc').valid).toBe(true);
    expect(validateConfigValue(colorOption, '#abc').valid).toBe(true);
    expect(validateConfigValue(colorOption, 'black').valid).toBe(true);
    expect(validateConfigValue(colorOption, 'medium spring green').valid).toBe(true);
  });

  it('rejects malformed color values and unknown color names', () => {
    const malformedHex = validateConfigValue(colorOption, '#12345');
    const unknownName = validateConfigValue(colorOption, 'not a real color');

    expect(malformedHex.valid).toBe(false);
    expect(malformedHex.errors).toContain('Use #RGB, RGB, #RRGGBB, RRGGBB, or a named X11 color.');
    expect(unknownName.valid).toBe(false);
    expect(unknownName.errors).toContain('Use #RGB, RGB, #RRGGBB, RRGGBB, or a named X11 color.');
  });

  it('accepts Ghostty duration sequences with documented units', () => {
    expect(validateConfigValue(durationOption, '1h30m').valid).toBe(true);
    expect(validateConfigValue(durationOption, '45s').valid).toBe(true);
    expect(validateConfigValue(durationOption, '750ms').valid).toBe(true);
    expect(validateConfigValue(durationOption, '100us').valid).toBe(true);
    expect(validateConfigValue(durationOption, '50µs').valid).toBe(true);
    expect(validateConfigValue(durationOption, '1w 2d').valid).toBe(true);
    expect(validateConfigValue(durationOption, '1 h 30 m').valid).toBe(true);
    expect(validateConfigValue(durationOption, '0').valid).toBe(true);
  });

  it('rejects malformed duration values', () => {
    expect(validateConfigValue(durationOption, '1').errors).toContain('A duration without a unit is only valid when it is exactly 0.');
    expect(validateConfigValue(durationOption, '1.5s').errors).toContain('Duration values must use whole numbers followed by units.');
    expect(validateConfigValue(durationOption, '10fortnights').errors).toContain('Unknown duration unit "fortnights". Use y, w, d, h, m, s, ms, us, µs, or ns.');
  });

  it('warns when numeric values are outside the Ghostty clamp range', () => {
    const result = validateConfigValue(numberOption, 2);

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Ghostty will clamp values above 1 down to 1.');
  });

  it('rejects non-finite numeric values', () => {
    const result = validateConfigValue(numberOption, Number.NaN);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Enter a valid number.');
  });
});
