import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PresetsDialog } from './PresetsDialog';
import { useConfigStore } from '@/lib/store/config-store';
import { useHistoryStore } from '@/lib/store/history-store';
import { useToastStore } from '@/lib/store/toast-store';
import { presets } from '@/data/presets';

beforeEach(() => {
  act(() => {
    useConfigStore.getState().resetAll();
    useHistoryStore.getState().clear();
    useToastStore.getState().dismiss();
  });
});

afterEach(() => cleanup());

function renderOpen(onOpenChange = vi.fn()) {
  render(<PresetsDialog trigger={null} open onOpenChange={onOpenChange} />);
  return onOpenChange;
}

describe('PresetsDialog', () => {
  it('lists every preset and narrows by group', () => {
    renderOpen();
    expect(screen.getAllByRole('article')).toHaveLength(presets.length);

    fireEvent.click(screen.getByRole('button', { name: 'Aesthetic' }));

    const aesthetic = presets.filter((preset) => preset.category === 'aesthetic');
    expect(screen.getAllByRole('article')).toHaveLength(aesthetic.length);
    expect(screen.getByRole('button', { name: 'Aesthetic' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('combines search with the group filter', () => {
    renderOpen();

    fireEvent.change(screen.getByRole('textbox', { name: 'Search presets' }), { target: { value: 'zzzz-nothing' } });

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText('No presets found')).toBeInTheDocument();
  });

  it('applies a preset, closes, and offers Undo through the toast', () => {
    const onOpenChange = renderOpen();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Comfortable preset' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(useConfigStore.getState().config['font-size']).toBeDefined();
    expect(useToastStore.getState().toast?.text).toMatch(/^Applied Comfortable · \d+ settings replaced$/);
    expect(useToastStore.getState().toast?.icon).toBe('success');

    act(() => {
      useConfigStore.getState().undo();
    });
    expect(useConfigStore.getState().config).toEqual({});
  });

  it('stays open and says so when the preset changes nothing', () => {
    const onOpenChange = renderOpen();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Comfortable preset' }));
    act(() => {
      useToastStore.getState().dismiss();
    });
    onOpenChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Comfortable preset' }));

    expect(useToastStore.getState().toast).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Comfortable is already applied.');
  });

  it('starts fresh each time it is closed and reopened', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<PresetsDialog trigger={null} open onOpenChange={onOpenChange} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search presets' }), { target: { value: 'zzzz' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(<PresetsDialog trigger={null} open={false} onOpenChange={onOpenChange} />);
    rerender(<PresetsDialog trigger={null} open onOpenChange={onOpenChange} />);

    expect(screen.getByRole('textbox', { name: 'Search presets' })).toHaveValue('');
  });
});
