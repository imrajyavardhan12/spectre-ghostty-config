# Reviewing Spectre

What a reviewer should look for here, most important first. `CLAUDE.md` has the project rules and checks, and
`CONTRIBUTING.md` says how Ghostty behavior is sourced.

## What failure looks like

1. **The exported config is wrong for Ghostty.** An option writes the wrong key or serialization, or its type, default,
   repeatability, platform or "added in" version differs from Ghostty's config reference or the pinned `Config.zig`.
   Ghostty is the source of truth: a plausible-looking option that Ghostty rejects is a bug.
2. **A value splits or smuggles config lines.** A value with a line break, a control character or a prototype-style key
   (`__proto__`, `constructor`) reaches an export, a share link or the store. `src/lib/security/config-value-safety.ts`,
   `config-key-safety.ts` and `validate-shared-config.ts` are the gates; imports and share links are untrusted input.
3. **A risky setting goes unflagged.** Options that run programs or pull in more config (`command`, `initial-command`,
   `input`, `env`, `config-file`) or turn off a protection (`clipboard-read` or `clipboard-write` set to `allow`,
   `clipboard-paste-protection` set to false) must still show their notice in the import review and on the share page
   (`sensitive-options.ts`).
4. **Saved or shared state breaks.** The persisted store (`spectre-config`) or the share link format (`?c=`, with its
   `version`) changes shape without handling what users already have, an import silently drops values, or undo/redo
   and memory disagree.
5. **A claim about Ghostty is false.** An option description, default, "Needs 1.x" chip or compatibility doc says
   something the pinned release doesn't, or nightly behavior is described as stable (`COMPATIBILITY.md`).
6. **The CSP or headers regress.** A dev-only allowance (HMR, `'unsafe-eval'`, Vercel debug scripts) reaches the
   production branch of `buildCsp`, a remote origin is added without need, or `img-src` allows more than `'self' data:`.
7. **The preview lies or leaks.** It shows something the config doesn't say, the terminal isn't disposed on close or on
   a config change, the WASM failing to load isn't handled, or server and client render differently before the
   persisted store is rehydrated (`StoreProvider` does it on mount).
8. **The UI loses a basic.** A control can't be reached by keyboard, focus isn't returned after a dialog, motion ignores
   `prefers-reduced-motion`, or the layout breaks at 390 px. `bun run test:e2e` runs axe, so a new violation is a
   finding.
9. **A bug fix has no test that fails without it,** or a decision lives in a component instead of `src/lib`, where
   it can be tested.

## How to report

- Start with a count of findings, and say plainly when there is nothing to fix.
- Every finding gives a file and line, the defect in one sentence, and a concrete failure: the input or state that
  leads to the wrong outcome. A guess from a name is not evidence: read the code, or run something.
- Tag each finding **Important**, **Nit** or **Pre-existing** (a bug the change didn't introduce). At most three nits.
- Name the class of bug when one finding has siblings, so every instance gets fixed, not one line.
- Don't repeat a finding the author already answered unless the new code reopens it.

## Skip

- Generated files: `src/data/ghostty-default-keybinds.ts` and `src/data/ghostty-builtin-themes.ts` (regenerate, never
  hand-edit; review the script or the pinned version instead), and `bun.lock`.
- `coverage/`, `playwright-report/`, `test-results/`, `local-docs/`, and `screenshots/*.png`.
- Formatting. No formatter is enforced; ESLint decides what counts.
