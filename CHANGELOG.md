# Changelog

All notable changes to Spectre will be documented in this file.

Spectre tracks two versions:

- **Spectre app version** from `package.json`.
- **Ghostty compatibility version** documented from the official Ghostty config reference.

Ghostty configuration changes should be traceable to the official Ghostty docs or source code.

## Unreleased

### Changed

- Switched Dependabot to its Bun ecosystem so dependency updates include the committed `bun.lock` file.
- Declared the repository's Bun package-manager version in `package.json` for consistent local and CI tooling.
- Removed the unusable Prettier script; formatter adoption will be handled separately from functional changes.

### Fixed

- Removed a stale Ghostty documentation anchor alias that caused the weekly schema drift check to fail after upstream restored the canonical `shell-integration` anchor.

## [0.3.0] - 2026-07-03

### Added

- Added a repeatable text input for Ghostty string options that can be specified multiple times, such as `font-family`, `env`, `config-file`, `custom-shader`, and `gtk-custom-css`.
- Added source-backed inline validation diagnostics for Ghostty color, duration, and number settings.
- Added a Ghostty schema drift check script and weekly workflow that compare local option IDs against the official config reference.
- Added a `src/lib/security/` module that builds a strict Content Security Policy and a full security header set, with separate dev and prod variants.
- Added a runtime shape validator for shared configuration URLs that drops unknown option keys, coerces values to their schema type, rejects prototype-pollution payloads, and bounds payload size.
- Added unit tests covering the new CSP, headers, and shared-config validators.
- Added support for Ghostty keybind chains (`chain=<action>`), key tables (`resize/ctrl+h=resize_split:left,10`), key table clears (`resize/`), and slash-key triggers (`ctrl+/=new_tab`), plus the `activate_key_table_once` and `deactivate_all_key_tables` actions.

### Changed

- Updated Next.js, React, Vitest, Tailwind, Zustand, and related tooling dependencies.
- Updated CI checkout actions to `actions/checkout@v5`.
- Added dependency overrides for vulnerable transitive packages and removed unused `copy-webpack-plugin`.
- Shared configuration pages now preview/export the shared config without overwriting the user's persisted editor state; the config is only loaded when the user opens it in the editor.
- `next.config.ts` now applies a strict set of security headers to every route: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, and `Cross-Origin-Embedder-Policy` (prod only).
- `decodeConfig` now normalises share payloads to a known shape (no prototype chain, no unknown keys, no non-primitive values); a missing theme is now `null` everywhere instead of `undefined`.
- `fetchThemeList` and `fetchTheme` now assert a textual `content-type` and stream the response with a 256 KB byte cap to prevent hostile or compromised upstreams from streaming arbitrary content into the parser.
- Shared configuration keybind validation is now intentionally coarse for `trigger=action` entries so older or future-compatible bindings are not dropped from share links.

### Fixed

- Accepted Ghostty color values that use short hex, hex without `#`, or named X11 colors in color inputs.
- Cleared stale applied-theme metadata when importing configs or editing theme-derived color values.
- Ignored generated coverage output in ESLint and replaced the landing page coffee button image with `next/image`.
- Mapped repeatable `font-family` values to a browser CSS fallback stack in the terminal preview, falling back to `monospace` for empty values.
- Preserved Ghostty key table clear entries (`keybind = resize/`) when encoding and decoding shared configuration URLs.

## [0.2.0] - 2026-06-04

### Added

- Added product versioning with a runtime `SPECTRE_VERSION` constant synced to `package.json`.
- Added app version display in the UI and exported Ghostty config header.
- Added GitHub Actions CI for typecheck, lint, tests, and production build.
- Added preset schema validation tests to catch unknown Ghostty options and type mismatches.
- Added preset keybind validation coverage.
- Added shared palette utilities and tests for Ghostty `N=COLOR` syntax.
- Documented Ghostty docs/source as the project source of truth.

### Fixed

- Fixed preset config keys that used the non-existent `scrollback-lines` option; presets now use Ghostty's official `scrollback-limit` option.
- Fixed preset value types for string and enum options such as window padding, cursor blink, and copy-on-select.
- Corrected `scrollback-limit` schema description to describe bytes, matching the official Ghostty config reference.
- Fixed keybind validation for optional-parameter actions such as `copy_to_clipboard` and `close_tab`.
- Fixed manual palette editing/export/preview consistency by normalizing palette entries to Ghostty `index=color` syntax.
- Preserved backwards compatibility for previously persisted positional palette arrays.
- Hardened config import/export roundtrips for quoted strings with spaces or `=`, repeatable strings, repeatable paths, palettes, keybinds, unknown options, default values, and empty-value resets.
- Added Ghostty `keybind = clear` validation support.
- Corrected repeatable path schema coverage for `custom-shader` and `gtk-custom-css`.
- Preserved Ghostty path optional marker semantics for values such as `?optional.css` and `"?required.css"`.

### Changed

- Exported config headers now include the Spectre app version.
- Updated README setup instructions to use Bun.
- Updated README tech stack versions for Next.js 16, Tailwind CSS 4, and Zustand 5.
