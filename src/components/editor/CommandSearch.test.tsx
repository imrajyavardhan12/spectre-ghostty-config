import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CommandSearch } from './CommandSearch';
import { useConfigStore } from '@/lib/store/config-store';

function openSearch() {
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
}

describe('CommandSearch', () => {
  beforeAll(() => {
    // cmdk needs these; jsdom doesn't implement them.
    Element.prototype.scrollIntoView = () => {};
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => cleanup());

  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('opens with Cmd+K and suggests options before anything is typed', () => {
    render(<CommandSearch onSelectOption={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    openSearch();

    expect(screen.getByRole('dialog', { name: 'Search Settings' })).toBeTruthy();
    expect(screen.getByText('Suggested')).toBeTruthy();
    expect(screen.getByRole('option', { name: /font-size/ })).toBeTruthy();
  });

  it('lists matches with their key and category, and counts them', () => {
    render(<CommandSearch onSelectOption={vi.fn()} />);
    openSearch();

    fireEvent.change(screen.getByRole('combobox', { name: 'Search' }), { target: { value: 'cursor-style' } });

    const row = screen.getAllByRole('option')[0];
    expect(row.textContent).toContain('cursor-style');
    expect(row.textContent).toContain('Cursor');
    expect(screen.getByText(/^Options · (\d+ of )?\d+$/)).toBeTruthy();
  });

  it('shows how many of the matches are listed, and announces the count', () => {
    render(<CommandSearch onSelectOption={vi.fn()} />);
    openSearch();

    fireEvent.change(screen.getByRole('combobox', { name: 'Search' }), { target: { value: 'a' } });

    expect(screen.getByText(/^Options · 8 of \d+$/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/^8 of \d+ options$/);
  });

  it('opens with a capital K too, as Caps Lock sends it', () => {
    render(<CommandSearch onSelectOption={vi.fn()} />);

    fireEvent.keyDown(document, { key: 'K', ctrlKey: true });

    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('names the platform only when the category does not', () => {
    render(<CommandSearch onSelectOption={vi.fn()} />);
    openSearch();

    // App Icon Style is a macOS option in the macOS category; Thicken Fonts is one in Fonts.
    expect(screen.getByRole('option', { name: /macos-icon/ }).textContent).not.toContain('only');
    fireEvent.change(screen.getByRole('combobox', { name: 'Search' }), { target: { value: 'font-thicken' } });
    expect(screen.getAllByRole('option')[0].textContent).toContain('Fonts · macOS only');
  });

  it('hands the chosen option over and closes', () => {
    const onSelectOption = vi.fn();
    render(<CommandSearch onSelectOption={onSelectOption} />);
    openSearch();

    fireEvent.click(screen.getByRole('option', { name: /font-size/ }));

    expect(onSelectOption).toHaveBeenCalledWith(expect.objectContaining({ id: 'font-size' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('says nothing matched, and clears the search from there', () => {
    render(<CommandSearch onSelectOption={vi.fn()} />);
    openSearch();
    const input = screen.getByRole('combobox', { name: 'Search' }) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'blink rate' } });
    expect(screen.getByText('No options match “blink rate”')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(screen.getByText('Suggested')).toBeTruthy();
  });

  it('starts empty each time it opens', () => {
    render(<CommandSearch onSelectOption={vi.fn()} />);
    openSearch();
    fireEvent.change(screen.getByRole('combobox', { name: 'Search' }), { target: { value: 'cursor' } });
    openSearch(); // toggles closed

    openSearch();

    expect((screen.getByRole('combobox', { name: 'Search' }) as HTMLInputElement).value).toBe('');
  });

  it('leaves out newer-than-target options while they are hidden', () => {
    act(() => {
      useConfigStore.getState().setTargetVersion('1.1.0');
      useConfigStore.getState().setHideUnsupported(true);
    });
    render(<CommandSearch onSelectOption={vi.fn()} />);
    openSearch();

    fireEvent.change(screen.getByRole('combobox', { name: 'Search' }), { target: { value: 'background-image' } });

    expect(screen.getByText(/^No options match/)).toBeTruthy();
  });
});
