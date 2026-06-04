# Spectre - Ghostty Config Generator

<div align="center">
  <h1>👻</h1>
  <h3>A beautiful, modern configuration generator for Ghostty terminal</h3>
  <p>
    <a href="https://ghostty.org">Ghostty</a> •
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## Features

- 👻 **Real Ghostty Preview** - Live terminal preview powered by [libghostty](https://mitchellh.com/writing/libghostty-is-coming) WASM - see exactly how your config will look!
- 🎨 **Visual Color Editor** - Pick colors with an intuitive color picker and palette editor
- 🎭 **200+ Themes** - Browse and apply themes from iTerm2 Color Schemes with one click
- 🔤 **Font Configuration** - Configure font families, sizes, styles, and OpenType features
- ⌨️ **Keybind Manager** - Create and manage custom keyboard shortcuts
- 📦 **100+ Options** - Support for all Ghostty configuration options
- 💾 **Import/Export** - Import existing configs and export ready-to-use config files
- 🔗 **Shareable URLs** - Share your configuration with others via URL
- 🌙 **Dark Mode** - Beautiful dark interface that matches your terminal aesthetic
- 📱 **Responsive** - Works on desktop and mobile devices

## Screenshots

### Landing Page
![Landing Page](screenshots/landing.png)

### Config Editor with Live libghostty Preview
![Editor with libghostty Preview](screenshots/editor-preview.png)

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
- **Terminal Preview**: [ghostty-web](https://github.com/coder/ghostty-web) (libghostty compiled to WASM)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand 5](https://zustand-demo.pmnd.rs/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Ghostty Source of Truth

Spectre treats the official Ghostty project as the source of truth for configuration behavior:

1. [Ghostty Config Reference](https://ghostty.org/docs/config/reference) for option names, descriptions, defaults, types, platforms, and availability.
2. [Ghostty Official Docs](https://ghostty.org/docs) for broader behavior and release notes.
3. [Ghostty GitHub/source](https://github.com/ghostty-org/ghostty) when documentation is ambiguous or needs source-level confirmation.

Schema changes should be traceable to these upstream sources.

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements

- [Mitchell Hashimoto](https://github.com/mitchellh) - Creator of Ghostty and libghostty
- [Coder](https://github.com/coder) - For [ghostty-web](https://github.com/coder/ghostty-web), the WASM build of libghostty that powers our terminal preview
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
