# Changelog

All notable changes to Spectre will be documented in this file.

Spectre tracks two versions:

- **Spectre app version** from `package.json`.
- **Ghostty compatibility version** documented from the official Ghostty config reference.

Ghostty configuration changes should be traceable to the official Ghostty docs or source code.

## Unreleased

### Added

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

### Changed

- Updated README setup instructions to use Bun.
- Updated README tech stack versions for Next.js 16, Tailwind CSS 4, and Zustand 5.
