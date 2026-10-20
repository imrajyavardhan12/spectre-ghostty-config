import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { PreviewPane } from './PreviewPane';
import { useConfigStore } from '@/lib/store/config-store';

// The terminal needs WASM and a canvas; the pane only has to host it.
vi.mock('@/components/preview', () => ({
  GhosttyPreview: ({ onViewConfig }: { onViewConfig?: () => void }) => (
    <button onClick={onViewConfig}>mock preview</button>
  ),
}));

describe('PreviewPane', () => {
  beforeEach(() => {
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('switches between the preview and the config, and counts modified settings', () => {
    const onTabChange = vi.fn();
    act(() => {
      useConfigStore.getState().setValue('font-size', 16);
    });
    render(<PreviewPane tab="preview" onTabChange={onTabChange} onCollapse={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'Preview' }).getAttribute('aria-selected')).toBe('true');
    expect(within(screen.getByRole('tab', { name: /^Config/ })).getByText('1')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: /^Config/ }));
    expect(onTabChange).toHaveBeenCalledWith('config');
  });

  it('hands the preview a way to open the config', () => {
    const onTabChange = vi.fn();
    render(<PreviewPane tab="preview" onTabChange={onTabChange} onCollapse={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'mock preview' }));

    expect(onTabChange).toHaveBeenCalledWith('config');
  });

  it('puts Copy, Download and Share in the header on the config tab only', () => {
    const { rerender } = render(<PreviewPane tab="preview" onTabChange={vi.fn()} onCollapse={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Copy/ })).toBeNull();

    rerender(<PreviewPane tab="config" onTabChange={vi.fn()} onCollapse={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Copy/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
  });

  it('numbers the config lines and keeps the numbers out of the text', () => {
    act(() => {
      useConfigStore.getState().setValue('font-size', 16);
    });
    render(<PreviewPane tab="config" onTabChange={vi.fn()} onCollapse={vi.fn()} />);

    const pre = document.querySelector('pre')!;
    expect(pre.textContent).toContain('font-size = 16');
    expect(pre.querySelector('[aria-hidden="true"]')?.textContent).toBe('1');
  });

  it('scrolls the config sideways and by keyboard instead of clipping long lines', () => {
    act(() => {
      useConfigStore.getState().setValue('font-size', 16);
    });
    render(<PreviewPane tab="config" onTabChange={vi.fn()} onCollapse={vi.fn()} />);

    const region = screen.getByRole('region', { name: 'Generated config' });
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(region.className).toContain('overflow-auto');
  });

  it('collapses from the header', () => {
    const onCollapse = vi.fn();
    render(<PreviewPane tab="preview" onTabChange={vi.fn()} onCollapse={onCollapse} />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse preview pane' }));

    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
