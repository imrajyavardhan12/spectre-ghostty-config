# Spectre

A visual configuration generator for the Ghostty terminal: Next.js 16, React 19, Zustand, Tailwind 4, with a
live preview rendered by Ghostty's own VT engine (WASM). Ghostty is the source of truth for every option.
How to contribute (sources to check, advancing the stable target, presets, PR workflow): @CONTRIBUTING.md

## Checks

```bash
bun run typecheck && bun run lint && bun run test -- --run   # every change, ~10 s
bun run test:e2e                     # Playwright (starts its own server on :3100); `bunx playwright install chromium` once
bun run schema:check                 # options vs Ghostty's reference (needs network)
bun run keybinds:defaults --check    # generated default keybinds match the pinned Ghostty
bun run themes:builtin --check       # generated built-in theme names match the pinned Ghostty
```

Plain `bun run test` starts watch mode; pass `-- --run` for a single run.

## Proving a change works

- Report the summary lines you saw, not "tests pass".
- UI, routing, preview, import/export or sharing: also run `bun run test:e2e`. It covers the import → edit →
  preview → export/share path and axe accessibility checks.
- Visual changes: look at the page in Playwright at desktop width and 390 px, light and dark, and compare with
  `screenshots/`. Put before/after screenshots in the PR.
- Option schema: check behaviour against Ghostty itself. With Ghostty installed,
  `ghostty +validate-config --config-file=<exported file>` proves an exported config parses.
- Generated files (`src/data/ghostty-default-keybinds.ts`, `src/data/ghostty-builtin-themes.ts`): regenerate,
  never hand-edit.
- Bug fix: add the test that fails without the fix. Tests sit next to the code (`*.test.ts(x)`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
