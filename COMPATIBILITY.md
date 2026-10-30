# Spectre and Ghostty compatibility

Spectre treats Ghostty—not Spectre's UI, preview, or local schema—as the final authority for configuration behavior. This document defines what the project means when it says a Spectre release is compatible with Ghostty.

## Current compatibility snapshot

| Spectre release line | Verified Ghostty stable release | Public config option IDs | Last verified |
| --- | --- | ---: | --- |
| `0.7.x` | [`1.4.0`](https://ghostty.org/docs/install/release-notes/1-4-0) | 213 | 2026-10-29 |

The machine-readable source for this row is [`compatibility.json`](compatibility.json). The stable schema is pinned to Ghostty's immutable [`v1.4.0` Config.zig snapshot](https://github.com/ghostty-org/ghostty/blob/v1.4.0/src/config/Config.zig). Spectre's 213 local option IDs match that stable source snapshot. The [official configuration reference](https://ghostty.org/docs/config/reference) still listed the 1.3.1 set on the verification date, so the tagged source is the authority for this release.

**This is a stable target, not a blanket minimum-version claim.** A config using only older options may work with an older Ghostty release. The editor's Ghostty version selector (persisted, defaulting to the stable target above) marks options newer than the selected release, can hide them from navigation and search, and exports and shared links warn about them explicitly instead of failing silently.

## What is covered

| Surface | Compatibility commitment |
| --- | --- |
| Option names | Every public option field in the pinned stable `Config.zig` is represented in Spectre. The scheduled/manual schema-drift workflow also checks the live official reference for added or removed option IDs. |
| Option metadata | Types, defaults, repeatability, platform notes, valid values, and `sinceVersion` metadata are reviewed against official docs and source. Option-ID parity is automated; metadata parity is reviewed and tested but is not yet mechanically exhaustive. |
| Import | Spectre parses Ghostty's `key = value` format into its structured model, including repeatable known values. For an unknown key, Spectre retains only its last value as a normalized string. Repeated unknown values, comments, ordering, and original quoting are not preserved. This is best-effort forward compatibility, not a lossless parser. |
| Export | Spectre emits the current non-default configuration values in Ghostty's text format. The header names Spectre's schema target and warns when unknown options are present; it does not certify those options for the target release. Ghostty remains the runtime validator, especially for filesystem paths, installed fonts, platform-specific behavior, commands, shaders, and values whose validity depends on the host system. |
| Share URLs | New links include a sanitized, human-readable path slug plus the compressed config payload. The slug is descriptive only; the validated payload remains authoritative. Legacy query-only links remain supported, and share routes are marked `noindex`. Shared payloads accept only options known to the current Spectre schema, so share URLs are not a lossless transport for future or nightly Ghostty options. Links with a usable configuration or theme show an amber notice counting settings skipped by validation; only real Ghostty option names are displayed, and other keys are counted, never shown. |
| Default keybinds | Keybind rows note which of Ghostty's default keybinds they change on macOS and Linux. The default tables are generated from the pinned stable `Config.zig` (`Keybinds.init`, evaluated per platform) into `src/data/ghostty-default-keybinds.ts`. Windows and other platforms are not modeled. |
| Built-in theme names | `src/data/ghostty-builtin-themes.ts` lists the themes bundled with the pinned release (the `iterm2_themes` dependency in its `build.zig.zon`). Curated presets may only reference these names. |
| Themes | Imported theme colors are translated to Ghostty color and palette options. The theme catalog is provided by iTerm2-Color-Schemes and is not part of Ghostty's compatibility contract. |
| Browser preview | The preview is a focused visual aid, not a native Ghostty runtime. See [Preview scope](#preview-scope). |

## Preview scope

Spectre currently uses [`ghostty-web@0.4.0`](https://github.com/coder/ghostty-web/tree/v0.4.0) (`v0.4.0`), whose Ghostty submodule points to a separate [Ghostty source snapshot](https://github.com/ghostty-org/ghostty/commit/5714ed07a1012573261b7b7e3ed2add9c1504496). That preview engine is versioned independently from Ghostty's stable desktop release.

The browser preview maps these settings:

- font family and font size
- foreground, background, background opacity, cursor, selection, and 16-color palette values
- cursor style and cursor blinking

These mappings are approximate where the web engine has a narrower API. For example, `block_hollow` is previewed as `block`, and cursor blinking is enabled only for a boolean `true` value.

It does **not** claim pixel-for-pixel parity with native Ghostty. In particular, it does not reproduce native window chrome and compositor behavior, platform integrations, shell integration, clipboard policy, keybindings, commands, notifications, quick terminal behavior, custom shaders, installed-font availability, or every renderer-specific setting.

Always validate a final exported config with the Ghostty version and platform where it will run.

## Version behavior

### Ghostty 1.4.0

This is the verified stable target for Spectre `0.7.x`. Option IDs are checked against the immutable release source. Ghostty 1.4.0 adds 11 options and renames one, and it changes how three existing settings behave. Spectre handles them like this:

- **`scrollback-limit` is now `scrollback-limit-bytes`.** Ghostty still accepts the old key. Imports, share links and saved settings are read as the new key, and an export for a target before 1.4 writes the old key. The default rose from 10 MB to 50 MB, so a value equal to 50 MB is kept and exported rather than dropped as unmodified (a 1.3 target would otherwise get 10 MB).
- **`copy-on-select`** takes `none`, `primary`, `clipboard` and `both`. `true` and `false` are still accepted but superseded, and `clipboard` no longer also fills the selection clipboard. Ghostty's default is `primary` on Linux and `none` elsewhere (it was `true` on macOS and Linux in 1.3), so Spectre's default is "Ghostty default", which exports nothing, and every explicit choice is exported.
- **`window-padding-balance`** is now an enum (`false`, `true`, `equal`); `equal` needs 1.4. Saved settings and older share links that hold a boolean are read as the matching value.
- **Values newer than the target** are labelled with their release in the editor, left out when newer options are hidden, and named in the export warning, the same as newer options.
- **Default keybinds** are regenerated from v1.4.0. On Linux, `ctrl+shift+page_up` and `ctrl+shift+page_down` now move the tab, and `jump_to_prompt` moved to `ctrl+shift+arrow_up` and `ctrl+shift+arrow_down`. Keybind actions `move_tab_to_new_window`, `prompt_window_title`, `set_window_title` and `open_config:new_window` are recognized.
- **Built-in themes** gain 356 names; for an older target they are marked "Needs 1.4", and the export warning names any in use.
- **Colors** accept every form Ghostty 1.4.0 reads: `#rgb`, `#rrggbb`, 9 and 12 digit hex, bare `rgb` and `rrggbb`, `rgb:RR/GG/BB` (1 to 4 hex digits per channel), `rgbi:` fractions, and X11 names. In the editor only spaces and tabs around a color are ignored, as in Ghostty; an import still trims the whole line first. The forms added in 1.4.0 (`rgb:`, `rgbi:` and the longer hex) are named in the export warning for an older target. The preview, swatches, palette buttons and theme cards show them as `#rrggbb`. `bold-color` is still free text in Spectre, so it isn't validated, but the export warning covers it.
- **`vt-window-resize-allowed` and `vt-xt-checksum-report`** are treated as sensitive when turned on, because they let a program move the window or read the screen back.

Known limits: default values and default keybind notes describe 1.4.0 even when an older target is selected. Spectre cannot represent the word `unlimited` for the two byte limits; an import says so instead of calling it a bad number. `command-palette-entry = clear` and `~` expansion in `theme` paths are new in 1.4.0 and are not flagged for an older target, and a share link's banner counts newer options but not newer values.

### Ghostty 1.3.1

Ghostty 1.3.1 introduced [`progress-style`](https://ghostty.org/docs/install/release-notes/1-3-1), which Spectre marks at the patch-level version where it first appears.

### Older Ghostty releases

Pick the installed release in the editor's Ghostty version selector (sidebar on desktop, category bar on mobile). Options it does not support are badged with their introducing release, can be hidden from navigation, search, and option lists with visible counts, and exports name them in a warning comment. Shared links flag them against the viewer's selected target. Filtering is advisory: it never deletes settings. Availability metadata (`sinceVersion`, absent meaning the 1.0 baseline) is audited against upstream `Config.zig` history; see `scripts/audit-ghostty-version-availability.ts`.

### Newer stable or nightly builds

Existing options usually continue to work, but compatibility is unverified until Spectre advances its stable target. For an unknown option, a local import/export can retain and re-emit only the last normalized value on a best-effort basis, with an explicit warning in generated output. The option will not gain an editor control or pass through a share URL until Spectre's schema is updated.

## How compatibility is verified

`bun run schema:check` performs two independent checks:

1. compares local option IDs with the moving official Ghostty config reference, catching upstream additions and removals;
2. verifies that the declared release tag and immutable commit contain the same `Config.zig`, then compares its public option IDs with the local schema.

`bun run keybinds:defaults --check` re-generates the default keybind tables from the pinned `Config.zig` and fails if the committed tables differ; the evaluator rejects any construct it does not recognize instead of guessing. Run `bun run keybinds:defaults` to regenerate after changing the pinned commit.

`bun run themes:builtin --check` does the same for the built-in theme names.

The weekly [Ghostty Schema Drift workflow](.github/workflows/schema-drift.yml) runs all three commands. Full compatibility updates also require maintainers to:

1. review Ghostty release notes and source changes;
2. update option types, defaults, values, platform restrictions, and availability metadata where needed;
3. add focused import, export, validation, sharing, or preview tests for changed behavior;
4. run lint, typecheck, unit tests, production build, schema checks, and browser tests;
5. update `compatibility.json`, this document, and `CHANGELOG.md` in the same pull request.

A passing option-ID check does not replace metadata or behavioral review.

## Reporting a mismatch

First confirm the behavior with the current stable Ghostty release. If Spectre accepts, rejects, imports, exports, or previews a value differently from Ghostty, open a focused [issue](https://github.com/imrajyavardhan12/spectre-ghostty-config/issues) containing:

- Spectre and Ghostty versions
- operating system and desktop environment where relevant
- the smallest config snippet that reproduces the mismatch
- Ghostty's warning/error output or a link to the authoritative upstream documentation

For general Ghostty behavior or installation support, use the channels listed in [SUPPORT.md](SUPPORT.md).
