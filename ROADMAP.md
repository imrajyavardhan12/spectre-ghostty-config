# Spectre Roadmap

Spectre's goal is to be the most trustworthy and approachable way to create a Ghostty configuration. This roadmap communicates direction rather than fixed delivery dates.

## Product principles

1. **Ghostty is the source of truth.** Generated configuration must match upstream behavior.
2. **Trust before breadth.** Import, export, sharing, and preview behavior must be safe and reversible.
3. **Fast visual feedback.** Configuration changes should be understandable without trial-and-error editing.
4. **Accessible everywhere.** Core workflows should work with keyboards, assistive technology, and mobile screens.
5. **Welcoming maintenance.** Contributors should be able to understand, test, and review changes confidently.

## Now — reliability and contributor foundation

- Keep the option schema synchronized with Ghostty upstream.
- Establish contributor, security, support, and issue workflows.
- Expand end-to-end coverage beyond the critical import → edit → preview → export/share path.
- Continue auditing editor and theme-browser accessibility beyond automated checks.
- Improve recovery when WASM preview initialization or remote theme fetching fails.
- Publish a clear compatibility statement for Spectre and Ghostty versions.

## Next — best-in-class editing experience

- Improve onboarding for users importing their first configuration.
- Make validation messages more actionable and source-linked.
- Refine editor navigation, search, keyboard operation, and mobile layouts.
- Improve theme discovery, comparison, and preview performance.
- Add confidence checks for keybind conflicts and platform-specific settings.

## Later — deeper Ghostty workflows

- Ghostty version selection and compatibility filtering.
- Curated, community-reviewed presets.
- Local configuration history and safer recovery.
- Installable PWA support where it improves real workflows.
- More advanced preview scenarios and configuration comparisons.

## How priorities are chosen

Work is prioritized by:

1. correctness, security, or data-loss risk
2. upstream Ghostty compatibility
3. impact on common user workflows
4. accessibility and reliability
5. contributor readiness and maintenance cost
6. community demand with a clear problem statement

Propose changes through [GitHub Discussions](https://github.com/imrajyavardhan12/spectre-ghostty-config/discussions) or a focused issue. Accepted ideas may move between sections as upstream Ghostty and community needs evolve.
