const ESC = "\x1b";
const CSI = `${ESC}[`;

const RESET = `${CSI}0m`;
const BOLD = `${CSI}1m`;
const DIM = `${CSI}2m`;
const ITALIC = `${CSI}3m`;
const UNDERLINE = `${CSI}4m`;

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

const BG_BLACK = `${CSI}40m`;
const BG_RED = `${CSI}41m`;
const BG_GREEN = `${CSI}42m`;
const BG_YELLOW = `${CSI}43m`;
const BG_BLUE = `${CSI}44m`;
const BG_MAGENTA = `${CSI}45m`;
const BG_CYAN = `${CSI}46m`;
const BG_WHITE = `${CSI}47m`;

function colorBlock(bg: string): string {
  return `${bg}  ${RESET}`;
}

export function generateDemoContent(themeName?: string | null): string {
  const lines: string[] = [];

  lines.push(`${CSI}2J${CSI}H`);

  lines.push(`${BOLD}${FG_MAGENTA}   ▄▄▄▄▄${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}  ▐█   ▀█▌${RESET}  ${FG_CYAN}Ghostty Preview${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}  ▐█▄▄▄█▌${RESET}   ${DIM}────────────────${RESET}`);
  lines.push(`${BOLD}${FG_MAGENTA}  ▐█   █▌${RESET}   ${FG_BLUE}OS:${RESET} macOS / Linux`);
  lines.push(`${BOLD}${FG_MAGENTA}   ▀▀▀▀▀${RESET}    ${FG_BLUE}Terminal:${RESET} Ghostty`);
  
  if (themeName) {
    lines.push(`             ${FG_BLUE}Theme:${RESET} ${themeName}`);
  } else {
    lines.push(`             ${FG_BLUE}Theme:${RESET} Custom`);
  }
  
  lines.push(`             ${FG_BLUE}Shell:${RESET} zsh 5.9`);
  lines.push("");

  lines.push(`  ${FG_WHITE}Normal Colors:${RESET}`);
  lines.push(
    `  ${colorBlock(BG_BLACK)}${colorBlock(BG_RED)}${colorBlock(BG_GREEN)}${colorBlock(BG_YELLOW)}${colorBlock(BG_BLUE)}${colorBlock(BG_MAGENTA)}${colorBlock(BG_CYAN)}${colorBlock(BG_WHITE)}`
  );
  lines.push(`  ${FG_BRIGHT_BLACK}Bright Colors:${RESET}`);
  lines.push(
    `  ${FG_BRIGHT_BLACK}██${FG_BRIGHT_RED}██${FG_BRIGHT_GREEN}██${FG_BRIGHT_YELLOW}██${FG_BRIGHT_BLUE}██${FG_BRIGHT_MAGENTA}██${FG_BRIGHT_CYAN}██${FG_BRIGHT_WHITE}██${RESET}`
  );
  lines.push("");

  lines.push(`  ${FG_WHITE}Text Styles:${RESET}`);
  lines.push(`  ${BOLD}Bold${RESET}  ${DIM}Dim${RESET}  ${ITALIC}Italic${RESET}  ${UNDERLINE}Underline${RESET}`);
  lines.push("");

  lines.push(`  ${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ ${FG_YELLOW}neofetch${RESET}`);
  lines.push(`  ${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ ${FG_YELLOW}ls -la${RESET}`);
  lines.push(`  ${FG_BLUE}drwxr-xr-x${RESET}  ${FG_GREEN}user${RESET} ${FG_CYAN}Documents${RESET}`);
  lines.push(`  ${FG_BLUE}drwxr-xr-x${RESET}  ${FG_GREEN}user${RESET} ${FG_CYAN}Downloads${RESET}`);
  lines.push(`  ${FG_BLUE}-rw-r--r--${RESET}  ${FG_GREEN}user${RESET} ${FG_WHITE}config${RESET}`);
  lines.push("");
  lines.push(`  ${FG_GREEN}user${RESET}@${FG_BLUE}ghostty${RESET}:${FG_CYAN}~${RESET}$ █`);

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
