import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TextInput } from './TextInput';
import { getOptionById } from '@/data/ghostty-options';
import { useConfigStore } from '@/lib/store/config-store';
import type { StringOption } from '@/lib/schema/types';

const lines = getOptionById('scrollback-limit-lines') as StringOption;
const plain = getOptionById('font-family-bold') as StringOption;

describe('TextInput', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('flags a limit that is neither a whole number nor unlimited, and keeps it out of the config', () => {
    render(<TextInput option={lines} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'lots' } });

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.value).toBe('lots');
    expect(screen.getByText('Use a whole number or unlimited.')).toBeTruthy();
    expect(useConfigStore.getState().config['scrollback-limit-lines']).toBeUndefined();
  });

  it('stores the limit once it is valid, and clears the error', () => {
    render(<TextInput option={lines} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'lots' } });
    fireEvent.change(input, { target: { value: '5000' } });

    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(useConfigStore.getState().config['scrollback-limit-lines']).toBe('5000');
  });

  it('replaces the unapplied text when the stored value changes elsewhere', () => {
    render(<TextInput option={lines} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'lots' } });
    act(() => {
      useConfigStore.getState().setValue('scrollback-limit-lines', '200');
    });

    expect(input.value).toBe('200');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it.each(['unlimited', '5000', ''])('accepts %j as a limit', (value) => {
    render(<TextInput option={lines} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value } });

    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('leaves other text options unvalidated', () => {
    render(<TextInput option={plain} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'anything at all' } });

    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('refuses surrounding whitespace, which Ghostty rejects once the value is written back quoted', () => {
    render(<TextInput option={lines} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '100 ' } });

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(useConfigStore.getState().config['scrollback-limit-lines']).toBeUndefined();
  });

  it('accepts what Ghostty accepts, such as underscores and a plus sign', () => {
    render(<TextInput option={lines} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '1_000' } });
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(useConfigStore.getState().config['scrollback-limit-lines']).toBe('1_000');
  });

  it('drops the unapplied text when something else resets the config, even if this value did not change', () => {
    render(<TextInput option={lines} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'lots' } });
    expect(input.value).toBe('lots');
    act(() => {
      useConfigStore.getState().resetAll();
    });

    expect(input.value).toBe('');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });
});
