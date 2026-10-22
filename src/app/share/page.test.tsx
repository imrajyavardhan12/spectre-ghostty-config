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

    const flag = screen.getByRole('note');
    expect(flag).toHaveTextContent('2 settings in this shared config require Ghostty newer than 1.1.0');
    expect(flag).toHaveTextContent('background-image arrived in 1.2.');
    expect(flag).toHaveTextContent('progress-style arrived in 1.3.1.');
    expect(screen.getByText('Needs 1.2')).toBeInTheDocument();
    expect(screen.getByText('Needs 1.3.1')).toBeInTheDocument();
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

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Needs /)).not.toBeInTheDocument();
  });

  it('loads shared config from the lower Open in Editor action', () => {
    render(<SharePage />);

    fireEvent.click(screen.getByRole('button', { name: /^Open in Editor$/i }));

    expect(useConfigStore.getState().config['font-size']).toBe(16);
    expect(useConfigStore.getState().appliedTheme).toBe('Dracula');
    expect(pushMock).toHaveBeenCalledWith('/editor');
  });

  it('flags the lines that run a program and lists their values in the warning', () => {
    currentSearchParams = new URLSearchParams(`c=${encodeConfig({ 'font-size': 16, command: '/bin/fish --login' })}`);

    render(<SharePage />);

    expect(screen.getByRole('region', { name: 'This config runs programs or changes security settings' })).toHaveTextContent(
      'command = /bin/fish --login'
    );
    expect(screen.getAllByText('Runs a program')).toHaveLength(1);
    expect(screen.getByText('Runs a program').closest('pre > div')).toHaveTextContent('command = "/bin/fish --login"');
  });

  it('says so when the clipboard refuses the copy, and confirms when it works', async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<SharePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy config' }));
    expect(await screen.findByText(/Couldn.t copy to the clipboard/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy config' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.queryByText(/Couldn.t copy to the clipboard/)).not.toBeInTheDocument();
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('font-size = 16'));
  });

  it('shows the invalid-link page for a corrupted payload', () => {
    currentSearchParams = new URLSearchParams('c=not-a-real-payload');

    render(<SharePage />);

    expect(screen.getByRole('heading', { name: 'Invalid share link' })).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: 'Open editor' })) expect(link).toHaveAttribute('href', '/editor');
    expect(screen.queryByRole('button', { name: 'Copy config' })).not.toBeInTheDocument();
  });

  it('shows a different page when the link has no payload at all', () => {
    currentSearchParams = new URLSearchParams();

    render(<SharePage />);

    expect(screen.getByRole('heading', { name: 'No configuration in this link' })).toBeInTheDocument();
  });
});
