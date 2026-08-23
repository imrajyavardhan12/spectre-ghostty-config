# Spectre and Ghostty compatibility

Spectre treats Ghostty—not Spectre's UI, preview, or local schema—as the final authority for configuration behavior. This document defines what the project means when it says a Spectre release is compatible with Ghostty.

## Current compatibility snapshot

| Spectre release line | Verified Ghostty stable release | Public config option IDs | Last verified |
| --- | --- | ---: | --- |
| `0.3.x` | [`1.3.1`](https://ghostty.org/docs/install/release-notes/1-3-1) | 202 | 2026-08-22 |

The machine-readable source for this row is [`compatibility.json`](compatibility.json). The stable schema is pinned to Ghostty's immutable [`v1.3.1` Config.zig snapshot](https://github.com/ghostty-org/ghostty/blob/v1.3.1/src/config/Config.zig). Spectre's 202 local option IDs match both that stable source snapshot and the current [official configuration reference](https://ghostty.org/docs/config/reference).

**This is a stable target, not a blanket minimum-version claim.** A config using only older options may work with an older Ghostty release. Spectre does not yet filter the editor or generated output by a selected Ghostty version, so users of older Ghostty releases must avoid options introduced after their installed version.

## What is covered

| Surface | Compatibility commitment |
| --- | --- |
| Option names | Every public option field in the pinned stable `Config.zig` is represented in Spectre. The scheduled/manual schema-drift workflow also checks the live official reference for added or removed option IDs. |
| Option metadata | Types, defaults, repeatability, platform notes, valid values, and `sinceVersion` metadata are reviewed against official docs and source. Option-ID parity is automated; metadata parity is reviewed and tested but is not yet mechanically exhaustive. |
| Import | Spectre parses Ghostty's `key = value` format into its structured model, including repeatable known values. For an unknown key, Spectre retains only its last value as a normalized string. Repeated unknown values, comments, ordering, and original quoting are not preserved. This is best-effort forward compatibility, not a lossless parser. |
| Export | Spectre emits the current non-default configuration values in Ghostty's text format. The header names Spectre's schema target and warns when unknown options are present; it does not certify those options for the target release. Ghostty remains the runtime validator, especially for filesystem paths, installed fonts, platform-specific behavior, commands, shaders, and values whose validity depends on the host system. |
| Share URLs | New links include a sanitized, human-readable path slug plus the compressed config payload. The slug is descriptive only; the validated payload remains authoritative. Legacy query-only links remain supported, and share routes are marked `noindex`. Shared payloads accept only options known to the current Spectre schema, so share URLs are not a lossless transport for future or nightly Ghostty options. |
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

### Ghostty 1.3.1

This is the verified stable target for Spectre `0.3.x`. Option IDs are checked against the immutable release source and the live official reference. Ghostty 1.3.1 introduced [`progress-style`](https://ghostty.org/docs/install/release-notes/1-3-1), which Spectre marks at the patch-level version where it first appears.

### Older Ghostty releases

Generated files may work when they contain only options and values supported by that release. Spectre currently shows newer options in the same editor and does not prevent exporting them for an older installation. Use each option's availability note and the upstream release documentation.

### Newer stable or nightly builds

Existing options usually continue to work, but compatibility is unverified until Spectre advances its stable target. For an unknown option, a local import/export can retain and re-emit only the last normalized value on a best-effort basis, with an explicit warning in generated output. The option will not gain an editor control or pass through a share URL until Spectre's schema is updated.

## How compatibility is verified

`bun run schema:check` performs two independent checks:

1. compares local option IDs with the moving official Ghostty config reference, catching upstream additions and removals;
2. verifies that the declared release tag and immutable commit contain the same `Config.zig`, then compares its public option IDs with the local schema.

The weekly [Ghostty Schema Drift workflow](.github/workflows/schema-drift.yml) runs the same command. Full compatibility updates also require maintainers to:

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
