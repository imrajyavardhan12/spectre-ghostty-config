# Spectre

Visual configuration generator for the Ghostty terminal: Next.js 16, React 19, Zustand, Tailwind 4, Bun. The live
preview is Ghostty's own VT engine (WASM). Ghostty is the source of truth for every option name, type and default.

## Commands

- `bun run typecheck && bun run lint && bun run test -- --run`: types, ESLint, Vitest once (~10 s). Plain
  `bun run test` starts watch mode.
- `bun run test:e2e`: Playwright with axe checks; starts its own server on :3100 (`bunx playwright install chromium` once)
- `bun run schema:check`: options vs Ghostty's reference (needs network)
- `bun run keybinds:defaults --check`, `bun run themes:builtin --check`: generated data matches the pinned Ghostty

## Verify before you say done

- Every change: run the first command above and quote the result lines.
- UI, routing, preview, import/export or sharing: also run `bun run test:e2e`.
- Visual change: look at the page in Playwright at desktop width and 390 px, light and dark; compare with `screenshots/`.
- Option behaviour: with Ghostty installed, `ghostty +validate-config --config-file=<exported file>` proves an
  export parses. Check upstream sources in the order CONTRIBUTING.md lists.
- Bug fix: first write the test that fails without the fix. Tests sit next to the code (`*.test.ts(x)`).

## Rules

- Never hand-edit `src/data/ghostty-default-keybinds.ts` or `src/data/ghostty-builtin-themes.ts`: regenerate them.
- Advancing the Ghostty stable target is a checklist (`compatibility.json`, docs, tests): follow CONTRIBUTING.md.
- No repo-wide formatter: match the surrounding file and don't reformat unrelated lines.
- Conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
