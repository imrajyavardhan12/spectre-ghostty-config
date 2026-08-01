# Contributing to Spectre

Thanks for helping make Ghostty configuration easier and safer. Contributions of code, documentation, testing, design feedback, and upstream research are welcome.

## Before you start

- Search existing [issues](https://github.com/imrajyavardhan12/spectre-ghostty-config/issues) and [pull requests](https://github.com/imrajyavardhan12/spectre-ghostty-config/pulls).
- Use [GitHub Discussions](https://github.com/imrajyavardhan12/spectre-ghostty-config/discussions) for support, questions, and early ideas.
- Open an issue before substantial changes so scope and behavior can be agreed before implementation.
- Report vulnerabilities privately according to [SECURITY.md](SECURITY.md), not in a public issue.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

Prerequisites:

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/) at the version declared by `packageManager` in `package.json`

```bash
git clone https://github.com/YOUR_USERNAME/spectre-ghostty-config.git
cd spectre-ghostty-config
bun install --frozen-lockfile
bun run dev
```

Open <http://localhost:3000>.

## Useful commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript checking |
| `bun run test -- --run` | Run the test suite once |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage -- --run` | Generate unit-test coverage |
| `bun run test:e2e` | Run browser end-to-end and accessibility tests |
| `bun run test:e2e:ui` | Open Playwright's interactive test runner |
| `bun run build` | Create a production build |
| `bun run schema:check` | Compare local options with Ghostty's reference |

Install Playwright's Chromium build before running browser tests for the first time:

```bash
bunx playwright install chromium
```

A repository-wide formatter is not currently enforced. Match the surrounding file and let ESLint catch enforceable style problems. Avoid unrelated formatting changes.

## Working on Ghostty configuration behavior

Ghostty itself is the source of truth. Check sources in this order:

1. [Ghostty Config Reference](https://ghostty.org/docs/config/reference)
2. [Ghostty documentation](https://ghostty.org/docs)
3. [Ghostty source](https://github.com/ghostty-org/ghostty)

When adding or changing an option:

- Preserve Ghostty's exact kebab-case option name and serialized behavior.
- Record type, default, platform restrictions, repeatability, and validation accurately.
- Add focused tests for import, export, validation, sharing, and preview mapping where applicable.
- Link the relevant upstream documentation or source in the pull request.
- Run `bun run schema:check` when network access is available.

## Pull request workflow

1. Fork the repository and create a focused branch from current `main`.
2. Make the smallest coherent change that solves the problem.
3. Add or update tests for observable behavior.
4. Update documentation and `CHANGELOG.md` when behavior changes.
5. Run the relevant checks locally.
6. Open a pull request using the template and include screenshots for visual changes.

Suggested branch names:

- `feat/theme-filtering`
- `fix/share-import-validation`
- `docs/contributor-guide`
- `chore/update-tooling`

Commit messages generally follow the existing conventional style, such as `feat:`, `fix:`, `docs:`, `test:`, and `chore:`.

## Review expectations

Pull requests are evaluated for:

- correctness against Ghostty behavior
- focused scope and backwards compatibility
- tests for important success and failure paths
- accessibility and responsive behavior for UI changes
- security at URL, config, browser-storage, and remote-fetch boundaries
- clear documentation and maintainable implementation

Maintainers may ask for a change to be split when independent concerns would be easier to review separately.

## Getting help

If you are unsure where to begin, look for [`good first issue`](https://github.com/imrajyavardhan12/spectre-ghostty-config/labels/good%20first%20issue) or [`help wanted`](https://github.com/imrajyavardhan12/spectre-ghostty-config/labels/help%20wanted) issues, or ask in [Discussions](https://github.com/imrajyavardhan12/spectre-ghostty-config/discussions).
