import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PreviewSheet } from './PreviewSheet';
import { useConfigStore } from '@/lib/store/config-store';

vi.mock('@/components/preview', () => ({
  GhosttyPreview: () => <div>mock preview</div>,
}));

function matchMedia(tablet: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: tablet && query.includes('768px'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('PreviewSheet', () => {
  beforeEach(() => {
    matchMedia(false);
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('opens as a named dialog on the chosen tab', () => {
    render(<PreviewSheet open onOpenChange={vi.fn()} tab="config" onTabChange={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Preview and generated config' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^Config/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('renders nothing while closed', () => {
    render(<PreviewSheet open={false} onOpenChange={vi.fn()} tab="preview" onTabChange={vi.fn()} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes from its own Close button, and offers only one', () => {
    const onOpenChange = vi.fn();
    render(<PreviewSheet open onOpenChange={onOpenChange} tab="preview" onTabChange={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('is a bottom sheet on a phone and a right-hand drawer on a tablet', () => {
    const { unmount } = render(<PreviewSheet open onOpenChange={vi.fn()} tab="preview" onTabChange={vi.fn()} />);
    expect(screen.getByRole('dialog').className).toContain('bottom-0');
    unmount();

    matchMedia(true);
    render(<PreviewSheet open onOpenChange={vi.fn()} tab="preview" onTabChange={vi.fn()} />);
    expect(screen.getByRole('dialog').className).toContain('right-0');
  });
});
