import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from './segmented-control';

const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'none', label: 'None' },
  { value: 'client', label: 'Client' },
];

describe('SegmentedControl', () => {
  it('exposes a radio group with the selected choice checked and only it tabbable', () => {
    render(<SegmentedControl aria-label="Decoration" value="none" onValueChange={() => {}} options={options} />);

    expect(screen.getByRole('radiogroup', { name: 'Decoration' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'None' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'None' }).tabIndex).toBe(0);
    expect(screen.getByRole('radio', { name: 'Auto' }).tabIndex).toBe(-1);
  });

  it('picks a choice on click and moves with the arrow keys, wrapping at the ends', () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl aria-label="Decoration" value="client" onValueChange={onValueChange} options={options} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Auto' }));
    expect(onValueChange).toHaveBeenLastCalledWith('auto');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Client' }), { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenLastCalledWith('auto');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Client' }), { key: 'ArrowLeft' });
    expect(onValueChange).toHaveBeenLastCalledWith('none');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Client' }), { key: 'Home' });
    expect(onValueChange).toHaveBeenLastCalledWith('auto');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Client' }), { key: 'End' });
    expect(onValueChange).toHaveBeenLastCalledWith('client');
  });
});
