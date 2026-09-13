import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import SharePage from './page';
import { useConfigStore } from '@/lib/store/config-store';
import { encodeConfig } from '@/lib/utils/url-share';
import { GHOSTTY_COMPATIBILITY_VERSION } from '@/lib/compatibility';

const pushMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => currentSearchParams,
}));

function setSharedConfigParams() {
  const encoded = encodeConfig({ 'font-size': 16 }, 'Dracula');
  currentSearchParams = new URLSearchParams(`c=${encoded}`);
}

describe('SharePage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    setSharedConfigParams();
    act(() => {
      useConfigStore.getState().resetAll();
      useConfigStore.getState().setTargetVersion(GHOSTTY_COMPATIBILITY_VERSION);
    });
  });

  it('does not load shared config until the user opens it in the editor', () => {
    render(<SharePage />);

    expect(useConfigStore.getState().config).toEqual({});
    expect(useConfigStore.getState().appliedTheme).toBeNull();
  });

  it('loads shared config from the header Open Editor action', () => {
    render(<SharePage />);

    fireEvent.click(screen.getByRole('button', { name: /^Open Editor$/i }));

    expect(useConfigStore.getState().config['font-size']).toBe(16);
    expect(useConfigStore.getState().appliedTheme).toBe('Dracula');
    expect(pushMock).toHaveBeenCalledWith('/editor');
  });

  it('flags shared options newer than the viewer target without dropping them', () => {
    const encoded = encodeConfig({
      'font-size': 16,
      'progress-style': true,
      'background-image': '/tmp/bg.png',
    });
    currentSearchParams = new URLSearchParams(`c=${encoded}`);
    act(() => {
      useConfigStore.getState().setTargetVersion('1.1.0');
    });

    render(<SharePage />);

    const flag = screen.getByRole('status');
    expect(flag).toHaveTextContent('2 settings in this shared config require Ghostty newer than 1.1.0');
    expect(flag).toHaveTextContent('background-image, progress-style');
    // Payload stays intact: the preview renders lines across nodes, so match
    // against the full preview text instead of a single text node.
    const preview = document.querySelector('pre')?.textContent ?? '';
    expect(preview).toContain('font-size = 16');
    expect(preview).toContain('progress-style = true');
    expect(preview).toContain('background-image = /tmp/bg.png');
  });

  it('shows no flag when the shared config fits the viewer target', () => {
    const encoded = encodeConfig({ 'font-size': 16, 'progress-style': true });
    currentSearchParams = new URLSearchParams(`c=${encoded}`);

    render(<SharePage />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('loads shared config from the lower Open in Editor action', () => {
    render(<SharePage />);

    fireEvent.click(screen.getByRole('button', { name: /^Open in Editor$/i }));

    expect(useConfigStore.getState().config['font-size']).toBe(16);
    expect(useConfigStore.getState().appliedTheme).toBe('Dracula');
    expect(pushMock).toHaveBeenCalledWith('/editor');
  });
});
