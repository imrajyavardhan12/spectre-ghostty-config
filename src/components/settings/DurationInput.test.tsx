import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { DurationInput } from './DurationInput';
import { useConfigStore } from '@/lib/store/config-store';
import type { DurationOption } from '@/lib/schema/types';

const option: DurationOption = {
  id: 'resize-overlay-duration',
  name: 'Resize Overlay Duration',
  description: 'How long to show the resize overlay.',
  type: 'duration',
  default: '750ms',
  category: 'window',
};

describe('DurationInput', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('shows an inline error for malformed duration values', () => {
    render(<DurationInput option={option} />);

    fireEvent.change(screen.getByLabelText('Resize Overlay Duration'), {
      target: { value: '1' },
    });

    expect(useConfigStore.getState().config['resize-overlay-duration']).toBeUndefined();
    expect(screen.getByText('A duration without a unit is only valid when it is exactly 0.')).toBeTruthy();
  });

  it('accepts documented duration values', () => {
    render(<DurationInput option={option} />);

    fireEvent.change(screen.getByLabelText('Resize Overlay Duration'), {
      target: { value: '1h30m' },
    });

    expect(useConfigStore.getState().config['resize-overlay-duration']).toBe('1h30m');
    expect(screen.queryByText('A duration without a unit is only valid when it is exactly 0.')).toBeNull();
  });
});
