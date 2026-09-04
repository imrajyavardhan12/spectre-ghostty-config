import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportReviewDialog } from './ImportReviewDialog';
import { analyzeGhosttyConfig } from '@/lib/utils/config-import-analysis';

describe('ImportReviewDialog', () => {
  it('shows valid imported instructions before confirmation', async () => {
    const analysis = analyzeGhosttyConfig(`
font-size = 16
font-family = "JetBrains Mono"
cursor-style = bar
`);
    const onConfirm = vi.fn();

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={96}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Review imported configuration' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 current settings will be replaced\./)
    ).toBeInTheDocument();
    expect(screen.getByText('font-size = 16')).toBeInTheDocument();
    expect(screen.getByText('font-family = JetBrains Mono')).toBeInTheDocument();
    expect(screen.getByText('cursor-style = bar')).toBeInTheDocument();

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    await waitFor(() => expect(cancel).toHaveFocus());

    fireEvent.click(screen.getByRole('button', { name: 'Replace with 3 settings' }));
    expect(onConfirm).toHaveBeenCalledWith(analysis.candidateConfig);
  });

  it('shows invalid known values and explicit partial-import action copy', () => {
    const analysis = analyzeGhosttyConfig(`
font-size = 16
mouse-hide-while-typing = maybe
`);
    const onConfirm = vi.fn();

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={48}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('font-size = 16')).toBeInTheDocument();
    expect(screen.getByText(/Line 3.*Use 1, 0, t, T, f, F, true, or false\./)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Replace with 1 setting and skip 1 line',
      })
    );
    expect(onConfirm).toHaveBeenCalledWith({ 'font-size': 16 });
  });

  it('shows clamp warnings without counting retained values as skipped', () => {
    const analysis = analyzeGhosttyConfig('cursor-opacity = 2');

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={18}
        currentSettingCount={0}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByText(
        'Warning — Line 1 · cursor-opacity: Ghostty will clamp values above 1 down to 1.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Replace with 1 setting' })
    ).toBeEnabled();
    expect(screen.queryByText(/skipped line/)).not.toBeInTheDocument();
  });

  it('uses explicit defaults-only action copy for a meaningful empty result', () => {
    const analysis = analyzeGhosttyConfig('font-size = 13\ncursor-style =\n');

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={32}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Replace current config with defaults' })
    ).toBeEnabled();
    expect(screen.getByText('cursor-style = (reset to default)')).toBeInTheDocument();
  });

  it('disables replacement when no meaningful instruction exists', () => {
    const analysis = analyzeGhosttyConfig('# comment only\nnot an instruction\n');

    render(
      <ImportReviewDialog
        open
        fileName="config"
        fileSize={34}
        currentSettingCount={2}
        analysis={analysis}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Nothing usable to apply' })
    ).toBeDisabled();
  });
});
