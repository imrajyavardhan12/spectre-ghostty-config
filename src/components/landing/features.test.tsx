import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FontSizeDemo } from './FontSizeDemo';
import { VersionTargeting } from './VersionTargeting';
import { ClosingCta } from './LandingChrome';
import { presets } from '@/data/presets';

beforeEach(() => {
  // Reveal observes its element; jsdom has no IntersectionObserver.
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
});

describe('FontSizeDemo', () => {
  it('steps the size and stops at the ends', () => {
    render(<FontSizeDemo />);
    const value = () => screen.getByRole('status', { name: 'Font size' }).textContent;
    expect(value()).toBe('14');

    fireEvent.click(screen.getByRole('button', { name: 'Larger' }));
    expect(value()).toBe('15');

    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByRole('button', { name: 'Larger' }));
    expect(value()).toBe('20');
    expect(screen.getByRole('button', { name: 'Larger' })).toBeDisabled();

    for (let i = 0; i < 12; i++) fireEvent.click(screen.getByRole('button', { name: 'Smaller' }));
    expect(value()).toBe('10');
    expect(screen.getByRole('button', { name: 'Smaller' })).toBeDisabled();
  });
});

describe('VersionTargeting', () => {
  it('hides the newer option and says so when an older version is picked', () => {
    render(<VersionTargeting />);
    expect(screen.getByRole('radio', { name: 'Ghostty 1.3' })).toBeChecked();
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['1.0.1', '1.1.3', '1.2.3', '1.3.1']);
    expect(screen.getByText('Key remap').closest('[data-hidden]')).toHaveAttribute('data-hidden', 'false');
    expect(screen.getByRole('status', { name: 'Version support' })).toHaveTextContent('Every option is shown.');

    fireEvent.click(screen.getByRole('radio', { name: 'Ghostty 1.2' }));

    expect(screen.getByRole('status', { name: 'Version support' })).toHaveTextContent('Options newer than Ghostty 1.2 are hidden.');
    expect(screen.getByText('Key remap').closest('[data-hidden]')).toHaveAttribute('data-hidden', 'true');

    fireEvent.click(screen.getByRole('radio', { name: 'Ghostty 1.3' }));
    expect(screen.getByRole('status', { name: 'Version support' })).toHaveTextContent('Every option is shown.');
  });
});

describe('ClosingCta', () => {
  it('names every real preset and counts them', () => {
    render(<ClosingCta />);

    expect(screen.getAllByRole('listitem')).toHaveLength(presets.length);
    for (const preset of presets) expect(screen.getByText(preset.name)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^\w+ presets to start from,/);
  });
});
