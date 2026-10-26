const ESC = "\x1b";
const CSI = `${ESC}[`;

// ANSI escape codes - defined for future use in demo content
const RESET = `${CSI}0m`;
const BOLD = `${CSI}1m`;
const DIM = `${CSI}2m`;
const ITALIC = `${CSI}3m`;
const UNDERLINE = `${CSI}4m`;
const INVERSE = `${CSI}7m`;
const STRIKETHROUGH = `${CSI}9m`;

const FG_BLACK = `${CSI}30m`;
const FG_RED = `${CSI}31m`;
const FG_GREEN = `${CSI}32m`;
const FG_YELLOW = `${CSI}33m`;
const FG_BLUE = `${CSI}34m`;
const FG_MAGENTA = `${CSI}35m`;
const FG_CYAN = `${CSI}36m`;
const FG_WHITE = `${CSI}37m`;

const FG_BRIGHT_BLACK = `${CSI}90m`;
const FG_BRIGHT_RED = `${CSI}91m`;
const FG_BRIGHT_GREEN = `${CSI}92m`;
const FG_BRIGHT_YELLOW = `${CSI}93m`;
const FG_BRIGHT_BLUE = `${CSI}94m`;
const FG_BRIGHT_MAGENTA = `${CSI}95m`;
const FG_BRIGHT_CYAN = `${CSI}96m`;
const FG_BRIGHT_WHITE = `${CSI}97m`;

/** Cut a name that would wrap, ending it with an ellipsis. */
function fitName(name: string, room: number): string {
  const width = Math.max(room, 4);
  return name.length > width ? `${name.slice(0, width - 1)}…` : name;
}

// The side-by-side layout is 41 columns wide. Narrower terminals (phones) get the compact one.
export const WIDE_DEMO_COLS = 41;

export function isCompactDemoWidth(cols: number): boolean {
  return cols < WIDE_DEMO_COLS;
}

export function generateDemoContent(themeName?: string | null, os?: string, cols?: number): string {
  const lines: string[] = [];
  const osLabel = os === "linux" ? "Linux" : os === "windows" ? "Windows" : "macOS";

  if (cols !== undefined && isCompactDemoWidth(cols)) return generateCompactDemoContent(themeName, osLabel, cols);

  lines.push(`${CSI}2J${CSI}H`);

  lines.push(`${BOLD}${FG_MAGENTA}    ▄▄▄▄▄${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}   ▐█   ▀█▌${RESET}   ${BOLD}${FG_CYAN}Ghostty Terminal Preview${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}   ▐█▄▄▄█▌${RESET}    ${DIM}Powered by libghostty WASM${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}   ▐█   █▌${RESET}    ${DIM}───────────────────────────${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}    ▀▀▀▀▀${RESET}     ${FG_BLUE}OS:${RESET} ${osLabel}`);
  lines.push(`               ${FG_BLUE}Terminal:${RESET} Ghostty`);
  
  if (themeName) {
    // 22 columns of indent and label come before the name.
    const shownTheme = cols === undefined ? themeName : fitName(themeName, cols - 22);
    lines.push(`               ${FG_BLUE}Theme:${RESET} ${FG_GREEN}${shownTheme}${RESET}`);
  } else {
    lines.push(`               ${FG_BLUE}Theme:${RESET} ${FG_YELLOW}Custom${RESET}`);
  }
  
  lines.push(`               ${FG_BLUE}Shell:${RESET} zsh 5.9`);
  lines.push("");

  lines.push(`  ${BOLD}${FG_WHITE}Color Palette${RESET}`);
  lines.push(`  ${DIM}Normal:${RESET}  ${FG_BLACK}███${FG_RED}███${FG_GREEN}███${FG_YELLOW}███${FG_BLUE}███${FG_MAGENTA}███${FG_CYAN}███${FG_WHITE}███${RESET}`);
  lines.push(`  ${DIM}Bright:${RESET}  ${FG_BRIGHT_BLACK}███${FG_BRIGHT_RED}███${FG_BRIGHT_GREEN}███${FG_BRIGHT_YELLOW}███${FG_BRIGHT_BLUE}███${FG_BRIGHT_MAGENTA}███${FG_BRIGHT_CYAN}███${FG_BRIGHT_WHITE}███${RESET}`);
  lines.push("");

  lines.push(`  ${BOLD}${FG_WHITE}Text Styles${RESET}`);
  lines.push(`  ${RESET}Normal${RESET}  ${BOLD}Bold${RESET}  ${DIM}Dim${RESET}  ${ITALIC}Italic${RESET}`);
  lines.push(`  ${UNDERLINE}Underline${RESET}  ${STRIKETHROUGH}Strike${RESET}  ${INVERSE}Inverse${RESET}`);
  lines.push("");

  lines.push(`  ${BOLD}${FG_WHITE}Sample Terminal Session${RESET}`);
  lines.push(`  ${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ ${FG_YELLOW}echo${RESET} ${FG_GREEN}"Hello, Ghostty!"${RESET}`);
  lines.push(`  Hello, Ghostty!`);
  lines.push(`  ${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ ${FG_YELLOW}ls${RESET} ${FG_CYAN}--color=auto${RESET}`);
  lines.push(`  ${FG_BLUE}Documents${RESET}  ${FG_BLUE}Downloads${RESET}  ${FG_GREEN}script.sh${RESET}`);
  lines.push(`  ${FG_WHITE}config${RESET}     ${FG_MAGENTA}image.png${RESET}`);
  lines.push(`  ${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ ${FG_YELLOW}git${RESET} status`);
  lines.push(`  ${FG_GREEN}On branch main${RESET}`);
  lines.push(`  ${FG_RED}Changes not staged for commit:${RESET}`);
  lines.push(`      ${FG_RED}modified:${RESET}   src/config.ts`);
  lines.push("");
  lines.push(`  ${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ `);

  return lines.join("\r\n");
}

/** The same sample stacked in one column. Every line is at most 28 columns, except a long theme name, which is cut to fit. */
function generateCompactDemoContent(themeName: string | null | undefined, osLabel: string, cols: number): string {
  const lines: string[] = [];
  const shownTheme = themeName ? fitName(themeName, cols - "  Theme: ".length) : themeName;
  const prompt = `${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$`;

  lines.push(`${CSI}2J${CSI}H`);

  lines.push(`${BOLD}${FG_MAGENTA}    ▄▄▄▄▄${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}   ▐█   ▀█▌${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}   ▐█▄▄▄█▌${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}   ▐█   █▌${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}    ▀▀▀▀▀${RESET}`);
  lines.push("");
  lines.push(`  ${BOLD}${FG_CYAN}Ghostty Terminal Preview${RESET}`);
  lines.push(`  ${DIM}Powered by libghostty WASM${RESET}`);
  lines.push(`  ${DIM}${"─".repeat(24)}${RESET}`);
  lines.push(`  ${FG_BLUE}OS:${RESET} ${osLabel}`);
  lines.push(`  ${FG_BLUE}Terminal:${RESET} Ghostty`);
  lines.push(
    shownTheme
      ? `  ${FG_BLUE}Theme:${RESET} ${FG_GREEN}${shownTheme}${RESET}`
      : `  ${FG_BLUE}Theme:${RESET} ${FG_YELLOW}Custom${RESET}`
  );
  lines.push(`  ${FG_BLUE}Shell:${RESET} zsh 5.9`);
  lines.push("");

  lines.push(`  ${BOLD}${FG_WHITE}Color Palette${RESET}`);
  lines.push(`  ${FG_BLACK}███${FG_RED}███${FG_GREEN}███${FG_YELLOW}███${FG_BLUE}███${FG_MAGENTA}███${FG_CYAN}███${FG_WHITE}███${RESET}`);
  lines.push(`  ${FG_BRIGHT_BLACK}███${FG_BRIGHT_RED}███${FG_BRIGHT_GREEN}███${FG_BRIGHT_YELLOW}███${FG_BRIGHT_BLUE}███${FG_BRIGHT_MAGENTA}███${FG_BRIGHT_CYAN}███${FG_BRIGHT_WHITE}███${RESET}`);
  lines.push("");

  lines.push(`  ${BOLD}${FG_WHITE}Text Styles${RESET}`);
  lines.push(`  ${RESET}Normal${RESET}  ${BOLD}Bold${RESET}  ${DIM}Dim${RESET}  ${ITALIC}Italic${RESET}`);
  lines.push(`  ${UNDERLINE}Underline${RESET}  ${STRIKETHROUGH}Strike${RESET}  ${INVERSE}Inverse${RESET}`);
  lines.push("");

  lines.push(`  ${BOLD}${FG_WHITE}Sample Terminal Session${RESET}`);
  lines.push(`  ${prompt} ${FG_YELLOW}echo${RESET} ${FG_GREEN}"Hi"${RESET}`);
  lines.push(`  Hi`);
  lines.push(`  ${prompt} ${FG_YELLOW}ls${RESET}`);
  lines.push(`  ${FG_BLUE}Documents${RESET}  ${FG_BLUE}Downloads${RESET}`);
  lines.push(`  ${FG_GREEN}script.sh${RESET} ${FG_WHITE}config${RESET} ${FG_MAGENTA}image.png${RESET}`);
  lines.push(`  ${prompt} ${FG_YELLOW}git${RESET} status`);
  lines.push(`  ${FG_GREEN}On branch main${RESET}`);
  lines.push(`  ${FG_RED}Changes not staged:${RESET}`);
  lines.push(`    ${FG_RED}modified:${RESET} src/config.ts`);
  lines.push("");
  lines.push(`  ${prompt} `);

  return lines.join("\r\n");
}

export function generateMinimalDemo(): string {
  const lines: string[] = [];
  
  lines.push(`${CSI}2J${CSI}H`);
  lines.push(`${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ echo "Hello, Ghostty!"`);
  lines.push(`Hello, Ghostty!`);
  lines.push("");
  lines.push(`${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ █`);

  return lines.join("\r\n");
}

export function generateColorPaletteDemo(): string {
  const lines: string[] = [];

  lines.push(`${CSI}2J${CSI}H`);
  lines.push(`${BOLD}Color Palette Test${RESET}`);
  lines.push("");

  lines.push("Standard colors (0-7):");
  let row = "";
  for (let i = 0; i < 8; i++) {
    row += `${CSI}48;5;${i}m  ${RESET}`;
  }
  lines.push(row);

  lines.push("");
  lines.push("Bright colors (8-15):");
  row = "";
  for (let i = 8; i < 16; i++) {
    row += `${CSI}48;5;${i}m  ${RESET}`;
  }
  lines.push(row);

  return lines.join("\r\n");
}
