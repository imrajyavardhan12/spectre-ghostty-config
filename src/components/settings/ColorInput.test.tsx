import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { ColorInput } from './ColorInput';
import { useConfigStore } from '@/lib/store/config-store';
import type { ColorOption } from '@/lib/schema/types';

const option: ColorOption = {
  id: 'background',
  name: 'Background Color',
  description: 'The background color of the terminal.',
  type: 'color',
  default: '',
  category: 'colors',
};

describe('ColorInput', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('accepts Ghostty named X11 colors', () => {
    render(<ColorInput option={option} />);

    fireEvent.change(screen.getByLabelText('Background Color'), {
      target: { value: 'medium spring green' },
    });

    expect(useConfigStore.getState().config.background).toBe('medium spring green');
    expect(screen.queryByText('Use #RGB, RGB, #RRGGBB, RRGGBB, or a named X11 color.')).toBeNull();
  });

  it('shows an inline error for malformed colors without storing them', () => {
    render(<ColorInput option={option} />);

    fireEvent.change(screen.getByLabelText('Background Color'), {
      target: { value: '#12345' },
    });

    expect(useConfigStore.getState().config.background).toBeUndefined();
    expect(screen.getByText('Use #RGB, RGB, #RRGGBB, RRGGBB, or a named X11 color.')).toBeTruthy();
  });
});
