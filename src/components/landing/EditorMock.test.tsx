import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { EditorMock } from './EditorMock';

function mockReducedMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('EditorMock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('cycles to the next sample theme every 3.2 seconds', () => {
    render(<EditorMock />);
    expect(screen.getByRole('button', { name: 'Tokyo Night' })).toHaveAttribute('aria-pressed', 'true');

    act(() => {
      vi.advanceTimersByTime(3200);
    });

    expect(screen.getByRole('button', { name: 'Rose Pine' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Tokyo Night' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets a dot choose the theme and restarts the wait', () => {
    render(<EditorMock />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Gruvbox Dark' }));
    expect(screen.getByRole('button', { name: 'Gruvbox Dark' })).toHaveAttribute('aria-pressed', 'true');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('button', { name: 'Gruvbox Dark' })).toHaveAttribute('aria-pressed', 'true');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('button', { name: 'Rose Pine Dawn' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('pauses while hovered', () => {
    const { container } = render(<EditorMock />);
    fireEvent.pointerEnter(container.firstElementChild as Element, { pointerType: 'mouse' });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByRole('button', { name: 'Tokyo Night' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('pauses while focus is inside, and resumes when it leaves', () => {
    render(<EditorMock />);
    const dot = screen.getByRole('button', { name: 'Tokyo Night' });

    fireEvent.focus(dot);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(dot).toHaveAttribute('aria-pressed', 'true');

    fireEvent.blur(dot);
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(screen.getByRole('button', { name: 'Rose Pine' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('restarts the wait even when the theme that is already showing is picked', () => {
    render(<EditorMock />);

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tokyo Night' }));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('button', { name: 'Tokyo Night' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not cycle under reduced motion, but the dots still work', () => {
    mockReducedMotion(true);
    render(<EditorMock />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByRole('button', { name: 'Tokyo Night' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Catppuccin Mocha' }));
    expect(screen.getByRole('button', { name: 'Catppuccin Mocha' })).toHaveAttribute('aria-pressed', 'true');
  });
});
