import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TextInputWithSuggestions } from './TextInputWithSuggestions';
import { getOptionById } from '@/data/ghostty-options';
import { useConfigStore } from '@/lib/store/config-store';
import type { StringOption } from '@/lib/schema/types';

const flags = getOptionById('bell-features') as StringOption;
const single = getOptionById('background-blur') as StringOption;

describe('TextInputWithSuggestions', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('adds and removes chips from a list of flags', () => {
    render(<TextInputWithSuggestions option={flags} />);

    fireEvent.click(screen.getByRole('button', { name: 'Audio' }));
    fireEvent.click(screen.getByRole('button', { name: 'Title' }));
    expect(useConfigStore.getState().config['bell-features']).toBe('audio,title');
    expect(screen.getByRole('button', { name: 'Audio' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Audio' }));
    expect(useConfigStore.getState().config['bell-features']).toBe('title');
    expect(screen.getByRole('button', { name: 'Audio' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('goes back to the default, not an empty value, when the last flag is removed', () => {
    const scroll = getOptionById('scroll-to-bottom') as StringOption;
    render(<TextInputWithSuggestions option={scroll} />);

    fireEvent.click(screen.getByRole('button', { name: 'Keystroke' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keystroke' }));

    expect(useConfigStore.getState().config['scroll-to-bottom']).toBeUndefined();
  });

  it('takes one value for options that are not lists, and a second click resets it', () => {
    render(<TextInputWithSuggestions option={single} />);

    fireEvent.click(screen.getByRole('button', { name: '20' }));
    fireEvent.click(screen.getByRole('button', { name: 'Default (20)' }));
    expect(useConfigStore.getState().config['background-blur']).toBe('true');
    expect(screen.getByRole('button', { name: '20' }).getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Default (20)' }));
    expect(useConfigStore.getState().config['background-blur']).toBeUndefined();
  });

  it('never joins values for an option that takes one', () => {
    render(<TextInputWithSuggestions option={single} />);

    fireEvent.click(screen.getByRole('button', { name: '20' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));

    expect(String(useConfigStore.getState().config['background-blur'] ?? 'false')).not.toContain(',');
  });

  it('labels the chips by what a click does', () => {
    const { rerender } = render(<TextInputWithSuggestions option={flags} />);
    expect(screen.getByText('Add')).toBeTruthy();

    rerender(<TextInputWithSuggestions option={single} />);
    expect(screen.getByText('Use')).toBeTruthy();
  });
});
