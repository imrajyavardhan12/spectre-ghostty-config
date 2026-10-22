import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeAppliedBar } from './ThemeAppliedBar';
import type { Theme } from '@/lib/utils/themes';

const theme: Theme = {
  name: 'Dracula',
  raw: '',
  colors: { background: '#282a36', foreground: '#f8f8f2', palette: Array(16).fill('#ff5555') },
};

describe('ThemeAppliedBar', () => {
  afterEach(cleanup);

  it('keeps an empty live region until a theme is applied', () => {
    const { rerender } = render(<ThemeAppliedBar theme={null} onOpenPane={vi.fn()} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerender(<ThemeAppliedBar theme={theme} onOpenPane={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Dracula applied');
  });

  it('opens the preview and the config, and links to the editor', () => {
    const onOpenPane = vi.fn();
    render(<ThemeAppliedBar theme={theme} onOpenPane={onOpenPane} />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'View config' }));

    expect(onOpenPane.mock.calls).toEqual([
      ['preview', screen.getByRole('button', { name: 'Preview' })],
      ['config', screen.getByRole('button', { name: 'View config' })],
    ]);
    expect(screen.getByRole('link', { name: /Open editor/ })).toHaveAttribute('href', '/editor');
  });
});
