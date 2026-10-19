import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeInput } from './ThemeInput';
import { getOptionById } from '@/data/ghostty-options';
import { useConfigStore } from '@/lib/store/config-store';
import type { StringOption } from '@/lib/schema/types';

const option = getOptionById('theme') as StringOption;

function openList() {
  fireEvent.click(screen.getByRole('combobox', { name: /Color Theme/ }));
}

describe('ThemeInput', () => {
  beforeAll(() => {
    // cmdk scrolls the highlighted item into view; jsdom doesn't implement it.
    Element.prototype.scrollIntoView = () => {};
  });

  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('shows the default and links to the full theme browser', () => {
    render(<ThemeInput option={option} />);

    expect(screen.getByRole('combobox', { name: /Color Theme/ }).textContent).toContain(
      'None (Ghostty default)'
    );
    expect(screen.getByRole('link', { name: /Browse all themes/ }).getAttribute('href')).toBe('/themes');
  });

  it('sets a built-in theme and clears it with None', () => {
    render(<ThemeInput option={option} />);

    openList();
    fireEvent.click(screen.getByRole('option', { name: 'Dracula' }));
    expect(useConfigStore.getState().config.theme).toBe('Dracula');
    expect(screen.getByRole('combobox', { name: /Color Theme/ }).textContent).toContain('Dracula');

    openList();
    fireEvent.click(screen.getByRole('option', { name: 'None (Ghostty default)' }));
    expect(useConfigStore.getState().config.theme).toBeUndefined();
  });

  it('starts the next search empty after a pick', () => {
    render(<ThemeInput option={option} />);

    openList();
    fireEvent.change(screen.getByPlaceholderText('Search themes...'), { target: { value: 'dracu' } });
    fireEvent.click(screen.getByRole('option', { name: 'Dracula' }));

    openList();
    expect((screen.getByPlaceholderText('Search themes...') as HTMLInputElement).value).toBe('');
  });

  it('does not offer a wrong-case built-in name as a custom value', () => {
    render(<ThemeInput option={option} />);

    openList();
    fireEvent.change(screen.getByPlaceholderText('Search themes...'), { target: { value: 'dracula' } });

    expect(screen.queryByRole('option', { name: /^Use / })).toBeNull();
    expect(screen.getByRole('option', { name: 'Dracula' })).toBeTruthy();
  });

  it('accepts a custom value such as a light/dark pair', () => {
    render(<ThemeInput option={option} />);

    openList();
    fireEvent.change(screen.getByPlaceholderText('Search themes...'), {
      target: { value: 'light:Dracula,dark:Nord' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Use light:Dracula,dark:Nord/ }));

    expect(useConfigStore.getState().config.theme).toBe('light:Dracula,dark:Nord');
  });
});
