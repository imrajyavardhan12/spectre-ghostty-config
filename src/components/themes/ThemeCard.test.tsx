import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeCard } from './ThemeCard';
import type { Theme } from '@/lib/utils/themes';

const theme: Theme = {
  name: 'Dracula',
  raw: '',
  colors: {
    background: '#282a36',
    foreground: '#f8f8f2',
    palette: Array(16).fill(''),
  },
};

describe('ThemeCard', () => {
  it('applies a theme synchronously without leaving delayed work behind', () => {
    const onApply = vi.fn();
    render(<ThemeCard theme={theme} onApply={onApply} />);

    fireEvent.click(screen.getByRole('button', { name: 'Apply Dracula theme' }));

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(theme);
  });

  it('exposes the applied state in the action name', () => {
    render(<ThemeCard theme={theme} isActive onApply={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Applied Dracula theme' })
    ).toBeInTheDocument();
  });
});
