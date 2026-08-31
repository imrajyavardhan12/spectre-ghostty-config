import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { NumberInput } from './NumberInput';
import { useConfigStore } from '@/lib/store/config-store';
import type { NumberOption } from '@/lib/schema/types';

const option: NumberOption = {
  id: 'cursor-opacity',
  name: 'Cursor Opacity',
  description: 'Opacity of the cursor.',
  type: 'number',
  numberKind: 'float',
  floatBits: 64,
  default: 1,
  category: 'cursor',
  min: 0,
  max: 1,
  step: 0.05,
};

describe('NumberInput', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('shows an inline warning when Ghostty will clamp an out-of-range value', () => {
    render(<NumberInput option={option} showSlider={false} />);

    fireEvent.change(screen.getByLabelText('Cursor Opacity'), {
      target: { value: '2' },
    });

    expect(useConfigStore.getState().config['cursor-opacity']).toBe(2);
    expect(screen.getByText('Ghostty will clamp values above 1 down to 1.')).toBeTruthy();
  });
});
