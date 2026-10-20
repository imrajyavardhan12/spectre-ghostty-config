import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MobileActionBar } from './MobileActionBar';
import { useConfigStore } from '@/lib/store/config-store';

const download = vi.hoisted(() => vi.fn());
vi.mock('@/lib/utils/download-config', () => ({ downloadConfigFile: download }));

describe('MobileActionBar', () => {
  beforeEach(() => {
    download.mockClear();
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  it('opens the sheet on the tab it names', () => {
    const onOpen = vi.fn();
    render(<MobileActionBar onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Config' }));

    expect(onOpen.mock.calls).toEqual([['preview'], ['config']]);
  });

  it('has nothing to export until a setting changes', () => {
    render(<MobileActionBar onOpen={vi.fn()} />);

    const exportButton = screen.getByRole('button', { name: /^Export/ });
    expect(exportButton).toHaveProperty('disabled', true);
    expect(exportButton.textContent).toContain('Export · 0');
  });

  it('exports the generated file and counts the modified settings', () => {
    act(() => {
      useConfigStore.getState().setValue('font-size', 16);
    });
    render(<MobileActionBar onOpen={vi.fn()} />);

    const exportButton = screen.getByRole('button', { name: 'Export · 1' });
    fireEvent.click(exportButton);

    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0][0]).toContain('font-size = 16');
  });
});
