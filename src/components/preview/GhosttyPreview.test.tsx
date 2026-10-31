'use client';

import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useConfigStore } from '@/lib/store/config-store';
import { GhosttyPreview } from './GhosttyPreview';

interface MockTerminalInstance {
  options: Record<string, unknown>;
  loadAddon: ReturnType<typeof vi.fn>;
  open: ReturnType<typeof vi.fn>;
  write: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

interface MockFitAddonInstance {
  fit: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => ({
  initGhosttyMock: vi.fn(),
  terminalInstances: [] as MockTerminalInstance[],
  fitAddonInstances: [] as MockFitAddonInstance[],
  failNextOpen: false,
  focusCalls: 0,
  cols: 92,
}));

vi.mock('@/lib/ghostty/init', () => ({
  initGhostty: mocks.initGhosttyMock,
}));

vi.mock('ghostty-web', () => {
  class MockTerminal {
    options: Record<string, unknown>;
    loadAddon = vi.fn();
    open = vi.fn(function (this: MockTerminal) {
      if (mocks.failNextOpen) {
        mocks.failNextOpen = false;
        throw new Error('open failed');
      }
      // Like ghostty-web, open() ends by focusing the terminal.
      this.focus();
    });
    focus() {
      mocks.focusCalls += 1;
    }
    write = vi.fn();
    dispose = vi.fn();
    cols = mocks.cols;
    rows = 34;

    constructor(options: Record<string, unknown>) {
      this.options = options;
      mocks.terminalInstances.push(this);
    }
  }

  class MockFitAddon {
    fit = vi.fn();
    dispose = vi.fn();

    constructor() {
      mocks.fitAddonInstances.push(this);
    }
  }

  return {
    FitAddon: MockFitAddon,
    Terminal: MockTerminal,
    init: vi.fn(),
  };
});

describe('GhosttyPreview lifecycle', () => {
  beforeEach(() => {
    mocks.initGhosttyMock.mockReset();
    mocks.initGhosttyMock.mockResolvedValue(undefined);
    mocks.terminalInstances.length = 0;
    mocks.fitAddonInstances.length = 0;
    mocks.failNextOpen = false;
    mocks.focusCalls = 0;
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not attach a terminal when initialization finishes after unmount', async () => {
    let resolveInitialization!: () => void;
    mocks.initGhosttyMock.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        resolveInitialization = resolve;
      })
    );

    const { unmount } = render(<GhosttyPreview />);
    await waitFor(() => expect(mocks.initGhosttyMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toHaveTextContent('Starting Ghostty…');

    unmount();

    await act(async () => {
      resolveInitialization();
    });

    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(0));

    render(<GhosttyPreview />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));
    expect(mocks.terminalInstances[0].open).toHaveBeenCalledTimes(1);
  });

  it('disposes the active terminal on unmount and creates a new one when remounted', async () => {
    const { unmount } = render(<GhosttyPreview />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));

    unmount();
    expect(mocks.terminalInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(mocks.fitAddonInstances[0].dispose).toHaveBeenCalledTimes(1);

    render(<GhosttyPreview />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(2));
    expect(mocks.terminalInstances[1].open).toHaveBeenCalledTimes(1);
  });

  it('keeps one live terminal under StrictMode and disposes it on unmount', async () => {
    // Dev renders run effects, their cleanups, then the effects again.
    const { unmount } = render(
      <StrictMode>
        <GhosttyPreview />
      </StrictMode>
    );
    const live = () => mocks.terminalInstances.filter((term) => term.dispose.mock.calls.length === 0);
    await waitFor(() => expect(live()).toHaveLength(1));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(live()).toHaveLength(1);

    unmount();

    expect(live()).toHaveLength(0);
  });

  it('applies configured background color and opacity to the preview window', async () => {
    act(() => {
      useConfigStore.getState().setValue('background', '#123456');
      useConfigStore.getState().setValue('background-opacity', 0.5);
    });

    render(<GhosttyPreview />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));

    const previewWindow = screen
      .getByText(/^Ghostty Preview/)
      .closest('.rounded-xl');
    expect(previewWindow).toHaveStyle({
      backgroundColor: '#123456',
      opacity: '0.5',
    });
  });

  it('paints the preview window with the color forms of Ghostty 1.4 as CSS can read them', async () => {
    act(() => {
      useConfigStore.getState().setValue('background', 'rgb:00/00/ff');
      useConfigStore.getState().setValue('foreground', 'rgbi:1/1/1');
    });

    render(<GhosttyPreview />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));

    const previewWindow = screen.getByText(/^Ghostty Preview/).closest('.rounded-xl');
    expect(previewWindow).toHaveStyle({ backgroundColor: '#0000ff' });
    expect(screen.getByText(/^Ghostty Preview/)).toHaveStyle({ color: '#ffffff' });
  });

  it('lets a newer config creation supersede an in-flight request', async () => {
    let resolveStaleCreation!: () => void;
    mocks.initGhosttyMock
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => {
          resolveStaleCreation = resolve;
        })
      )
      .mockResolvedValueOnce(undefined);

    render(<GhosttyPreview />);
    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));

    act(() => {
      useConfigStore.getState().setValue('font-size', 14);
    });
    await waitFor(
      () => expect(mocks.initGhosttyMock).toHaveBeenCalledTimes(2),
      { timeout: 1_000 }
    );

    act(() => {
      useConfigStore.getState().setValue('font-size', 16);
    });
    await waitFor(
      () => expect(mocks.terminalInstances).toHaveLength(2),
      { timeout: 1_000 }
    );

    await act(async () => {
      resolveStaleCreation();
    });

    expect(mocks.terminalInstances).toHaveLength(2);
    expect(mocks.terminalInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(mocks.terminalInstances[1].options.fontSize).toBe(16);
  });

  it('disposes partially created resources and announces open failures', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.failNextOpen = true;

    render(<GhosttyPreview />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Preview couldn't start");
    expect(alert).toHaveTextContent('open failed');
    expect(mocks.terminalInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(mocks.fitAddonInstances[0].dispose).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe('GhosttyPreview focus', () => {
  beforeEach(() => {
    mocks.initGhosttyMock.mockReset();
    mocks.initGhosttyMock.mockResolvedValue(undefined);
    mocks.terminalInstances.length = 0;
    mocks.focusCalls = 0;
  });

  afterEach(() => cleanup());

  it('does not take keyboard focus from the field being edited when it creates a terminal', async () => {
    render(
      <>
        <input aria-label="font style" />
        <GhosttyPreview />
      </>
    );
    const field = screen.getByLabelText('font style');
    field.focus();

    await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));
    const [terminal] = mocks.terminalInstances;
    await waitFor(() => expect(terminal.open).toHaveBeenCalledTimes(1));

    expect(mocks.focusCalls).toBe(0);
    expect(document.activeElement).toBe(field);
    // The terminal's own focus() is restored for explicit use afterwards.
    expect(Object.prototype.hasOwnProperty.call(terminal, 'focus')).toBe(false);
  });
});

describe('GhosttyPreview pane', () => {
  beforeEach(() => {
    mocks.initGhosttyMock.mockReset();
    mocks.initGhosttyMock.mockResolvedValue(undefined);
    mocks.terminalInstances.length = 0;
    mocks.fitAddonInstances.length = 0;
    mocks.failNextOpen = false;
    act(() => {
      useConfigStore.getState().resetAll();
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says it is loading, then live, and shows the terminal grid', async () => {
    render(<GhosttyPreview />);
    expect(screen.getByText('Loading preview')).toBeTruthy();

    expect(await screen.findByText('Live — updates as you edit')).toBeTruthy();
    expect(await screen.findByText('92×34')).toBeTruthy();
    expect(screen.getByText('libghostty · wasm')).toBeTruthy();
  });

  it('draws a failure on the app surface, not the terminal colors, and offers the config', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.failNextOpen = true;
    const onViewConfig = vi.fn();

    render(<GhosttyPreview onViewConfig={onViewConfig} />);

    const alert = await screen.findByRole('alert');
    expect(alert.className).toContain('bg-card');
    expect(screen.getByText('Preview unavailable')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'View config' }));
    expect(onViewConfig).toHaveBeenCalledTimes(1);
  });

  it('drops the grid size when the preview stops being live', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<GhosttyPreview />);
    await screen.findByText('92×34');

    mocks.initGhosttyMock.mockRejectedValueOnce(new Error('engine gone'));
    mocks.terminalInstances.length = 0;
    act(() => {
      useConfigStore.getState().setValue('font-size', 17);
    });

    await screen.findByRole('alert', {}, { timeout: 2000 });
    expect(screen.queryByText('92×34')).toBeNull();
  });

  it('writes the compact sample when the terminal is narrower than the wide one', async () => {
    mocks.cols = 37;
    try {
      render(<GhosttyPreview />);
      await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));
      const terminal = mocks.terminalInstances[0];
      await waitFor(() => expect(terminal.write).toHaveBeenCalledTimes(2));

      const sample = String(terminal.write.mock.calls[1][0]);
      // The title sits under the logo instead of beside it.
      expect(sample).toMatch(/\r\n {2}\x1b\[2mPowered by libghostty WASM/);
    } finally {
      mocks.cols = 92;
    }
  });

  it('swaps the sample when a resize crosses the narrow/wide threshold', async () => {
    const callbacks = new Set<() => void>();
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      private callback: () => void;
      constructor(callback: () => void) {
        this.callback = callback;
        callbacks.add(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        callbacks.delete(this.callback);
      }
    } as unknown as typeof ResizeObserver;
    const resize = () => act(() => [...callbacks].forEach((callback) => callback()));
    try {
      render(<GhosttyPreview />);
      await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));
      const terminal = mocks.terminalInstances[0] as MockTerminalInstance & { cols: number };
      await waitFor(() => expect(terminal.write).toHaveBeenCalledTimes(2));
      const wideSample = String(terminal.write.mock.calls[1][0]);

      // The pane narrows, as when a phone rotates.
      terminal.cols = 37;
      resize();
      expect(terminal.write).toHaveBeenCalledTimes(4);
      const compactSample = String(terminal.write.mock.calls[3][0]);
      expect(compactSample).not.toBe(wideSample);

      // Staying narrow does not redraw.
      resize();
      expect(terminal.write).toHaveBeenCalledTimes(4);

      // And it widens again.
      terminal.cols = 92;
      resize();
      expect(terminal.write).toHaveBeenCalledTimes(6);
      expect(String(terminal.write.mock.calls[5][0])).toBe(wideSample);
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  it('refits once more after a resize, in case the first fit was skipped', async () => {
    const callbacks = new Set<() => void>();
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      private callback: () => void;
      constructor(callback: () => void) {
        this.callback = callback;
        callbacks.add(callback);
      }
      observe() {}
      unobserve() {}
      disconnect() {
        callbacks.delete(this.callback);
      }
    } as unknown as typeof ResizeObserver;
    try {
      render(<GhosttyPreview />);
      await waitFor(() => expect(mocks.terminalInstances).toHaveLength(1));
      const terminal = mocks.terminalInstances[0] as MockTerminalInstance & { cols: number };
      const fitAddon = mocks.fitAddonInstances[0];
      await waitFor(() => expect(terminal.write).toHaveBeenCalledTimes(2));
      fitAddon.fit.mockClear();

      // ghostty-web skips fit() just after a resize, so the width has not changed yet.
      act(() => [...callbacks].forEach((callback) => callback()));
      expect(fitAddon.fit).toHaveBeenCalledTimes(1);
      expect(terminal.write).toHaveBeenCalledTimes(2);

      // By the time the trailing refit runs, the fit has applied.
      fitAddon.fit.mockImplementation(() => {
        terminal.cols = 37;
      });
      await waitFor(() => expect(terminal.write).toHaveBeenCalledTimes(4));
      expect(fitAddon.fit.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  it('offers no View config button when the caller gave no way to open it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.failNextOpen = true;

    render(<GhosttyPreview />);

    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'View config' })).toBeNull();
  });
});
