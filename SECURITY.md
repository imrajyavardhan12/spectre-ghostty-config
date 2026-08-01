# Security Policy

## Supported versions

Spectre is a hosted web application. Security fixes are applied to the latest deployment and the current `main` branch. Older tags are historical snapshots and do not receive separate security updates.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Use GitHub's private vulnerability reporting flow:

**[Report a vulnerability privately](https://github.com/imrajyavardhan12/spectre-ghostty-config/security/advisories/new)**

Include, when possible:

- the affected route, component, or configuration field
- reproduction steps or a minimal proof of concept
- expected and observed impact
- affected browsers or platforms
- suggested remediation, if known

Please remove credentials, personal data, and unrelated user configuration from reports.

We aim to acknowledge reports within 72 hours and provide an initial assessment within seven days. Timelines for a fix and disclosure depend on severity and complexity. We will coordinate disclosure with the reporter and credit them unless they prefer to remain anonymous.

## Relevant trust boundaries

Security-sensitive areas include:

- decoding and validating shared configuration URLs
- importing untrusted Ghostty configuration text
- rendering configuration-derived values in the browser
- fetching and parsing themes from external sources
- browser storage and clipboard interactions
- Content Security Policy and other deployment headers
- third-party JavaScript and WASM dependencies

This project does not currently operate a paid bug bounty program.
