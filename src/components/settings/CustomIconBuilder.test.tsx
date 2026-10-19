import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CustomIconBuilder } from './CustomIconBuilder';
import { IconInput } from './IconInput';
import { getOptionById } from '@/data/ghostty-options';
import { useConfigStore } from '@/lib/store/config-store';

// The preview paints to a canvas, which jsdom doesn't provide.
vi.mock('./CustomIconPreview', () => ({
  CustomIconPreview: () => <div data-testid="icon-preview" />,
}));

describe('CustomIconBuilder', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('sets the frame from the frame buttons', () => {
    render(<CustomIconBuilder />);

    expect(screen.getByRole('button', { name: 'Aluminum' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Chrome' }));

    expect(useConfigStore.getState().config['macos-icon-frame']).toBe('chrome');
    expect(screen.getByRole('button', { name: 'Chrome' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('only stores a color once it is a full hex value, and clears it', () => {
    render(<CustomIconBuilder />);
    const ghost = screen.getByLabelText('Ghost color');

    fireEvent.change(ghost, { target: { value: '#12' } });
    expect(useConfigStore.getState().config['macos-icon-ghost-color']).toBeUndefined();
    expect(ghost.getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(ghost, { target: { value: '#123abc' } });
    expect(useConfigStore.getState().config['macos-icon-ghost-color']).toBe('#123abc');

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(useConfigStore.getState().config['macos-icon-ghost-color']).toBeUndefined();
  });

  it('accepts the short and named colors Ghostty accepts', () => {
    render(<CustomIconBuilder />);
    const ghost = screen.getByLabelText('Ghost color');

    fireEvent.change(ghost, { target: { value: '#fff' } });
    expect(useConfigStore.getState().config['macos-icon-ghost-color']).toBe('#fff');

    fireEvent.change(ghost, { target: { value: 'red' } });
    expect(useConfigStore.getState().config['macos-icon-ghost-color']).toBe('red');
  });

  it('follows the stored value after an external change such as undo', () => {
    render(<CustomIconBuilder />);
    const ghost = screen.getByLabelText('Ghost color') as HTMLInputElement;

    fireEvent.change(ghost, { target: { value: '#123abc' } });
    act(() => {
      useConfigStore.getState().resetValue('macos-icon-ghost-color');
    });

    expect(ghost.value).toBe('');
  });

  it('keeps the two colors separate', () => {
    render(<CustomIconBuilder />);

    fireEvent.change(screen.getByLabelText('Screen color'), { target: { value: '#000000' } });

    expect(useConfigStore.getState().config['macos-icon-screen-color']).toBe('#000000');
    expect(useConfigStore.getState().config['macos-icon-ghost-color']).toBeUndefined();
  });
});

describe('IconInput', () => {
  const option = getOptionById('macos-icon')!;

  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('shows the builder inside the row only while the custom style is chosen', () => {
    const { rerender } = render(<IconInput option={option} />);
    expect(screen.queryByTestId('custom-icon-builder')).toBeNull();

    act(() => {
      useConfigStore.getState().setValue('macos-icon', 'custom-style');
    });
    rerender(<IconInput option={option} />);
    expect(screen.getByTestId('custom-icon-builder')).toBeTruthy();

    act(() => {
      useConfigStore.getState().setValue('macos-icon', 'blueprint');
    });
    rerender(<IconInput option={option} />);
    expect(screen.queryByTestId('custom-icon-builder')).toBeNull();
  });
});
