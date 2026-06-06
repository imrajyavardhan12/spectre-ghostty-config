# Changelog

All notable changes to Spectre will be documented in this file.

Spectre tracks two versions:

- **Spectre app version** from `package.json`.
- **Ghostty compatibility version** documented from the official Ghostty config reference.

Ghostty configuration changes should be traceable to the official Ghostty docs or source code.

## Unreleased

### Added

- Added a repeatable text input for Ghostty string options that can be specified multiple times, such as `font-family`, `env`, `config-file`, `custom-shader`, and `gtk-custom-css`.
- Added source-backed inline validation diagnostics for Ghostty color, duration, and number settings.

### Changed

- Updated Next.js, React, Vitest, Tailwind, Zustand, and related tooling dependencies.
- Added dependency overrides for vulnerable transitive packages and removed unused `copy-webpack-plugin`.
- Shared configuration pages now preview/export the shared config without overwriting the user's persisted editor state; the config is only loaded when the user opens it in the editor.

### Fixed

- Accepted Ghostty color values that use short hex, hex without `#`, or named X11 colors in color inputs.
- Cleared stale applied-theme metadata when importing configs or editing theme-derived color values.
- Ignored generated coverage output in ESLint and replaced the landing page coffee button image with `next/image`.

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
