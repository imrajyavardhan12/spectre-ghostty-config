# Spectre - Ghostty Config Generator

<div align="center">
  <h1>👻</h1>
  <h3>A beautiful, modern configuration generator for Ghostty terminal</h3>
  <p>
    <a href="https://spectre-ghostty-config.vercel.app">Open Spectre</a> •
    <a href="#features">Features</a> •
    <a href="COMPATIBILITY.md">Compatibility</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#roadmap">Roadmap</a> •
    <a href="#contributing">Contributing</a>
  </p>
  <p>
    <a href="https://github.com/imrajyavardhan12/spectre-ghostty-config/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/imrajyavardhan12/spectre-ghostty-config/actions/workflows/ci.yml/badge.svg" /></a>
    <a href="https://github.com/imrajyavardhan12/spectre-ghostty-config/releases"><img alt="GitHub release" src="https://img.shields.io/github/v/release/imrajyavardhan12/spectre-ghostty-config" /></a>
    <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/github/license/imrajyavardhan12/spectre-ghostty-config" /></a>
  </p>
</div>

---

## Features

- 👻 **Ghostty-Powered Preview** - Live terminal-style preview powered by [ghostty-web](https://github.com/coder/ghostty-web) for mapped fonts, colors, palettes, and cursor settings
- 🎨 **Visual Color Editor** - Pick colors with an intuitive color picker and palette editor
- 🎭 **200+ Themes** - Browse and apply themes from iTerm2 Color Schemes with one click
- 🔤 **Font Configuration** - Configure font families, sizes, styles, and OpenType features
- ⌨️ **Keybind Manager** - Create and manage custom keyboard shortcuts
- 📦 **Complete Stable Schema** - All 202 public configuration option IDs from the verified Ghostty stable target, guarded by automated drift checks
- 💾 **Import/Export** - Review imported settings before replacing your editor state, then export ready-to-use config files
- 🔗 **Readable Share URLs** - Share configurations with human-readable theme slugs while keeping existing links compatible
- 🌙 **Dark Mode** - Beautiful dark interface that matches your terminal aesthetic
- 📱 **Responsive** - Works on desktop and mobile devices

## Screenshots

### Landing Page
![Landing Page](screenshots/landing.png)

### Config Editor with Ghostty-Powered Preview
![Editor with Ghostty-powered preview](screenshots/editor-preview.png)

### Theme Browser
![Theme Browser](screenshots/themes.png)

## Getting Started

### Online

Visit [spectre-ghostty-config.vercel.app](https://spectre-ghostty-config.vercel.app) to use the tool online.

### Local Development

```bash
# Clone the repository
git clone https://github.com/imrajyavardhan12/spectre-ghostty-config.git
cd spectre-ghostty-config

# Install dependencies
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

### Build for Production

```bash
bun run build
bun run start
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Terminal Preview**: [ghostty-web](https://github.com/coder/ghostty-web) (Ghostty's terminal parser compiled to WASM)
- **End-to-End Testing**: [Playwright](https://playwright.dev/) with [axe-core](https://github.com/dequelabs/axe-core)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand 5](https://zustand-demo.pmnd.rs/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Ghostty Source of Truth

Spectre `0.3.x` currently targets [Ghostty 1.3.1](https://ghostty.org/docs/install/release-notes/1-3-1). The local schema contains all 202 public option IDs from that stable release. See the [compatibility policy](COMPATIBILITY.md) for the exact guarantees, version behavior, verification snapshot, and browser-preview limits.

Spectre treats the official Ghostty project as the source of truth for configuration behavior:

1. [Ghostty Config Reference](https://ghostty.org/docs/config/reference) for option names, descriptions, defaults, types, platforms, and availability.
2. [Ghostty Official Docs](https://ghostty.org/docs) for broader behavior and release notes.
3. [Ghostty GitHub/source](https://github.com/ghostty-org/ghostty) when documentation is ambiguous or needs source-level confirmation.

Schema changes should be traceable to these upstream sources. Maintainers can run:

```bash
bun run schema:check
```

to compare Spectre's local option IDs against both the live official reference and the pinned stable Ghostty source snapshot.

## Configuration Categories

| Category | Description |
|----------|-------------|
| **Fonts** | Font family, size, styles, variations |
| **Colors** | Theme, palette, background, foreground |
| **Window** | Decorations, padding, sizing, titlebar |
| **Cursor** | Style, color, blinking behavior |
| **Mouse** | Click behavior, scrolling, hiding |
| **Clipboard** | Copy/paste behavior and protection |
| **Keybinds** | Custom keyboard shortcuts |
| **Shell** | Shell integration, command, environment |
| **Application** | Startup, shutdown, notifications |
| **Quick Terminal** | Quick terminal dropdown settings |
| **macOS** | macOS-specific settings |
| **Linux** | Linux/GTK-specific settings |
| **Advanced** | Scrollback, shaders, image storage |

## Roadmap

Current priorities are upstream Ghostty correctness, end-to-end confidence, accessibility, preview resilience, and contributor readiness. See the [public roadmap](ROADMAP.md) for planned work and prioritization principles.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for setup, testing, Ghostty source-of-truth requirements, and the pull request workflow.

- Browse [`good first issue`](https://github.com/imrajyavardhan12/spectre-ghostty-config/labels/good%20first%20issue) and [`help wanted`](https://github.com/imrajyavardhan12/spectre-ghostty-config/labels/help%20wanted) work.
- Ask questions or explore early ideas in [GitHub Discussions](https://github.com/imrajyavardhan12/spectre-ghostty-config/discussions).
- Read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Support and security

Use [SUPPORT.md](SUPPORT.md) to choose between Discussions, issues, and upstream Ghostty support. Report vulnerabilities privately according to [SECURITY.md](SECURITY.md); do not open a public security issue.

## Acknowledgements

- [Mitchell Hashimoto](https://github.com/mitchellh) - Creator of Ghostty and libghostty
- [Coder](https://github.com/coder) - For [ghostty-web](https://github.com/coder/ghostty-web), the Ghostty-based WASM terminal engine that powers our browser preview
- [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) - Theme collection

## Related Projects

- [Ghostty](https://github.com/ghostty-org/ghostty) - The Ghostty terminal emulator
- [zerebos/ghostty-config](https://github.com/zerebos/ghostty-config) - Inspiration for this project

## License

MIT License - see [LICENSE](LICENSE) for details.

## Star History

<a href="https://star-history.com/#imrajyavardhan12/spectre-ghostty-config">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=imrajyavardhan12/spectre-ghostty-config&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=imrajyavardhan12/spectre-ghostty-config&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=imrajyavardhan12/spectre-ghostty-config&type=Date" />
  </picture>
</a>

---

<div align="center">
  Made with ❤️ for the Ghostty community
</div>
