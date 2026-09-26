# Presets

Spectre's presets are small, curated Ghostty configurations that a user can apply in one step. They're a trust signal: every line should be something we'd defend against the [Ghostty config reference](https://ghostty.org/docs/config/reference).

Presets live in [`src/data/presets.ts`](../src/data/presets.ts). The rules below are enforced by [`src/data/presets.test.ts`](../src/data/presets.test.ts), so `bun run test` tells you exactly which rule a preset breaks.

## Rules

1. **Only real changes.** Every value must differ from Ghostty's default. A preset that sets `font-size = 13` or `cursor-style = block` changes nothing and misleads the reader.
2. **Valid values.** Every value passes the same validators the editor uses.
3. **Keybinds that work and don't clobber defaults.** Keybinds must be valid, have no internal conflicts (no row may be overridden by a later one), and must not replace, unbind, or take over any of Ghostty's default keybinds on macOS or Linux. Prefer a leader sequence (`ctrl+a>…`) for new shortcuts.
4. **Built-in themes only.** A `theme` value must name a theme bundled with the Ghostty release Spectre targets (see [`src/data/ghostty-builtin-themes.ts`](../src/data/ghostty-builtin-themes.ts)). Light/dark pairs use Ghostty's syntax: `light:Rose Pine Dawn,dark:Rose Pine`. Use a theme instead of hand-copying a few colors, which leaves the rest of the palette mismatched.
5. **Declare fonts.** List every `font-family*` value in `fonts`, so the UI can tell users what to install. Ghostty embeds JetBrains Mono as its default font, so most presets need no font at all.
6. **Declare platforms.** If a preset uses an option that only works on some platforms (for example `font-thicken` or `window-save-state`, which are macOS-only), set `platforms` to the platforms where the whole preset applies.

## Writing a good preset

- **Have a point of view.** A preset should solve one clear need (reading comfort, screen sharing, log work, a theme) in a handful of settings. If a setting doesn't serve that need, leave it out.
- **Explain it in the description.** Say what the user will notice, not the option names. "Selections copy to the system clipboard" beats "copy-on-select = clipboard".
- **Be careful with resource settings.** `scrollback-limit` is per terminal surface and held in memory, so large values multiply with every split and tab.
- **Cite the reference.** In your pull request, link the reference section for each option you set and say why its value was chosen.

## Proposing a preset

Open a [preset proposal](https://github.com/imrajyavardhan12/spectre-ghostty-config/issues/new?template=preset_proposal.yml) with the config and the need it serves, or send a pull request that adds it to `src/data/presets.ts` with passing tests.
