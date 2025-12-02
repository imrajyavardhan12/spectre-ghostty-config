"use client";

import { useState, useRef, useEffect } from "react";
import { Monitor, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/lib/store/config-store";
import { cn } from "@/lib/utils";

interface TerminalPreviewProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TerminalPreview({ isOpen, onToggle }: TerminalPreviewProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [commandHistory, setCommandHistory] = useState<{ cmd: string; output?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { getValue } = useConfigStore();

  // Get config values with defaults
  const background = (getValue("background") as string) || "#1a1b26";
  const foreground = (getValue("foreground") as string) || "#c0caf5";
  const cursorColor = (getValue("cursor-color") as string) || foreground;
  const cursorStyle = (getValue("cursor-style") as string) || "block";
  const cursorBlink = (getValue("cursor-style-blink") as string) || "default";
  const cursorOpacity = (getValue("cursor-opacity") as number) ?? 1;
  const selectionBg = (getValue("selection-background") as string) || "#364a82";
  const selectionFg = (getValue("selection-foreground") as string) || foreground;
  const fontFamily = (getValue("font-family") as string) || "monospace";
  const fontSize = (getValue("font-size") as number) || 13;
  const fontThicken = (getValue("font-thicken") as boolean) || false;
  const boldIsBright = (getValue("bold-is-bright") as boolean) || false;
  const windowPaddingX = (getValue("window-padding-x") as number) ?? 2;
  const windowPaddingY = (getValue("window-padding-y") as number) ?? 2;
  const backgroundOpacity = (getValue("background-opacity") as number) ?? 1;
  
  // Get palette colors
  const palette = getValue("palette") as string[] | undefined;
  const getColor = (index: number, fallback: string) => {
    if (palette && palette[index]) {
      const match = palette[index].match(/^(\d+)=(.+)$/);
      if (match) return match[2].startsWith("#") ? match[2] : `#${match[2]}`;
    }
    return fallback;
  };

  // Standard terminal colors (with palette overrides)
  const colors = {
    black: getColor(0, "#15161e"),
    red: getColor(1, "#f7768e"),
    green: getColor(2, "#9ece6a"),
    yellow: getColor(3, "#e0af68"),
    blue: getColor(4, "#7aa2f7"),
    magenta: getColor(5, "#bb9af7"),
    cyan: getColor(6, "#7dcfff"),
    white: getColor(7, "#a9b1d6"),
    // Bright colors (8-15)
    brightBlack: getColor(8, "#414868"),
    brightRed: getColor(9, "#f7768e"),
    brightGreen: getColor(10, "#9ece6a"),
    brightYellow: getColor(11, "#e0af68"),
    brightBlue: getColor(12, "#7aa2f7"),
    brightMagenta: getColor(13, "#bb9af7"),
    brightCyan: getColor(14, "#7dcfff"),
    brightWhite: getColor(15, "#c0caf5"),
  };

  // Get bold color (use bright variant if bold-is-bright is enabled)
  const getBoldColor = (normalColor: string, brightColor: string) => {
    return boldIsBright ? brightColor : normalColor;
  };

  // Cursor styles
  const getCursorStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      opacity: cursorOpacity,
    };
    
    switch (cursorStyle) {
      case "block":
        return { 
          ...baseStyle,
          width: "0.6em", 
          height: "1.2em", 
          borderRadius: "1px",
          backgroundColor: cursorColor,
        };
      case "block_hollow":
        return { 
          ...baseStyle,
          width: "0.6em", 
          height: "1.2em", 
          borderRadius: "1px",
          backgroundColor: "transparent",
          border: `2px solid ${cursorColor}`,
        };
      case "underline":
        return { 
          ...baseStyle,
          width: "0.6em", 
          height: "2px", 
          borderRadius: "1px",
          backgroundColor: cursorColor,
        };
      case "bar":
        return { 
          ...baseStyle,
          width: "2px", 
          height: "1.2em", 
          borderRadius: "1px",
          backgroundColor: cursorColor,
        };
      default:
        return { 
          ...baseStyle,
          width: "0.6em", 
          height: "1.2em", 
          borderRadius: "1px",
          backgroundColor: cursorColor,
        };
    }
  };

  // Should cursor blink?
  const shouldCursorBlink = cursorBlink === "true" || cursorBlink === "default";

  // Handle command execution
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const cmd = inputValue.trim();
      let output: string | undefined;
      
      // Simulate some commands
      if (cmd === "clear") {
        setCommandHistory([]);
        setInputValue("");
        return;
      } else if (cmd.startsWith("echo ")) {
        output = cmd.slice(5).replace(/^["']|["']$/g, "");
      } else if (cmd === "whoami") {
        output = "user";
      } else if (cmd === "pwd") {
        output = "/home/user";
      } else if (cmd === "date") {
        output = new Date().toString();
      } else if (cmd === "ls") {
        output = "Desktop  Documents  Downloads  Pictures  Music";
      } else if (cmd === "help") {
        output = "Available commands: echo, whoami, pwd, date, ls, clear, help";
      } else {
        output = `command not found: ${cmd}`;
      }
      
      setCommandHistory(prev => [...prev, { cmd, output }]);
      setInputValue("");
    }
  };

  // Focus input when terminal is clicked
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  // Scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out",
        isMinimized
          ? "bottom-6 right-24 w-auto"
          : "bottom-6 right-24 w-[580px] max-w-[calc(100vw-8rem)]"
      )}
    >
      <div
        className={cn(
          "rounded-xl border border-border shadow-2xl overflow-hidden transition-all duration-300",
          isMinimized && "w-auto"
        )}
        style={{
          backgroundColor: background,
          opacity: backgroundOpacity,
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center justify-between px-3 py-2.5 border-b border-white/10"
          style={{ backgroundColor: `${background}dd` }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-2 group/buttons">
              <button
                onClick={onToggle}
                className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors flex items-center justify-center"
              >
                <span className="opacity-0 group-hover/buttons:opacity-100 text-[8px] font-bold text-black/60 transition-opacity">✕</span>
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-3.5 h-3.5 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors flex items-center justify-center"
              >
                <span className="opacity-0 group-hover/buttons:opacity-100 text-[10px] font-bold text-black/60 transition-opacity leading-none" style={{ marginTop: "-1px" }}>−</span>
              </button>
              <button
                onClick={() => setIsMinimized(false)}
                className="w-3.5 h-3.5 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors flex items-center justify-center"
              >
                <span className="opacity-0 group-hover/buttons:opacity-100 text-[8px] font-bold text-black/60 transition-opacity">+</span>
              </button>
            </div>
            <span
              className="text-xs opacity-60 ml-2"
              style={{ color: foreground }}
            >
              Terminal Preview
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-white/10"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-3 w-3" style={{ color: foreground }} />
              ) : (
                <Minimize2 className="h-3 w-3" style={{ color: foreground }} />
              )}
            </Button>
          </div>
        </div>

        {/* Terminal content */}
        {!isMinimized && (
          <div
            ref={terminalRef}
            onClick={handleTerminalClick}
            className="font-mono text-sm leading-relaxed overflow-y-auto cursor-text"
            style={{
              padding: `${windowPaddingY * 4}px ${windowPaddingX * 4}px`,
              fontFamily: fontFamily || "monospace",
              fontSize: `${fontSize}px`,
              fontWeight: fontThicken ? 500 : 400,
              color: foreground,
              height: "340px",
              // Selection styling via CSS variable
              ["--selection-bg" as string]: selectionBg,
              ["--selection-fg" as string]: selectionFg,
            }}
          >
            {/* Welcome message */}
            <div className="mb-2 opacity-60" style={{ color: foreground }}>
              Welcome to <span className="font-bold" style={{ color: getBoldColor(foreground, colors.brightWhite) }}>Ghostty</span> Terminal Preview
            </div>
            <div className="mb-2 opacity-60" style={{ color: foreground }}>
              Type &apos;help&apos; for available commands
            </div>
            {/* Selection preview */}
            <div className="mb-3">
              <span style={{ color: foreground }}>Selection: </span>
              <span 
                style={{ 
                  backgroundColor: selectionBg, 
                  color: selectionFg,
                  padding: "0 4px",
                  borderRadius: "2px",
                }}
              >
                selected text
              </span>
            </div>

            {/* Neofetch-style output */}
            <div className="mb-3 flex gap-4">
              {/* ASCII art */}
              <div className="flex-shrink-0" style={{ color: colors.magenta }}>
                <pre className="text-xs leading-tight">
{`   ▄▄▄▄▄
  ▐█   ▀█▌
  ▐█▄▄▄█▌
  ▐█   █▌
   ▀▀▀▀▀`}
                </pre>
              </div>
              
              {/* System info */}
              <div className="text-xs space-y-0.5">
                <div>
                  <span style={{ color: colors.blue }}>OS:</span>
                  <span style={{ color: foreground }}> macOS 14.0</span>
                </div>
                <div>
                  <span style={{ color: colors.blue }}>Terminal:</span>
                  <span style={{ color: foreground }}> Ghostty</span>
                </div>
                <div>
                  <span style={{ color: colors.blue }}>Shell:</span>
                  <span style={{ color: foreground }}> zsh 5.9</span>
                </div>
                <div>
                  <span style={{ color: colors.blue }}>Theme:</span>
                  <span style={{ color: foreground }}> Spectre</span>
                </div>
                {/* Color palette display */}
                <div className="flex gap-1 mt-2">
                  {Object.values(colors).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Command history */}
            {commandHistory.map((item, index) => (
              <div key={index} className="mb-1">
                {/* Command line */}
                <div className="flex flex-wrap">
                  <span style={{ color: colors.green }}>user</span>
                  <span style={{ color: foreground }}>@</span>
                  <span style={{ color: colors.blue }}>ghostty</span>
                  <span style={{ color: foreground }}>:</span>
                  <span style={{ color: colors.cyan }}>~</span>
                  <span style={{ color: foreground }}>$ </span>
                  <span style={{ color: colors.yellow }}>{item.cmd}</span>
                </div>
                {/* Output */}
                {item.output && (
                  <div style={{ color: foreground }}>{item.output}</div>
                )}
              </div>
            ))}

            {/* Active prompt with input */}
            <div className="flex flex-wrap items-center">
              <span style={{ color: colors.green }}>user</span>
              <span style={{ color: foreground }}>@</span>
              <span style={{ color: colors.blue }}>ghostty</span>
              <span style={{ color: foreground }}>:</span>
              <span style={{ color: colors.cyan }}>~</span>
              <span style={{ color: foreground }}>$ </span>
              <span style={{ color: colors.yellow }}>{inputValue}</span>
              {/* Cursor */}
              <span
                className={cn("inline-block ml-px", shouldCursorBlink && "animate-pulse")}
                style={getCursorStyle()}
              />
            </div>

            {/* Hidden input for capturing keystrokes */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="absolute opacity-0 pointer-events-none"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Floating button to toggle preview
export function PreviewToggleButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      onClick={onToggle}
      variant={isOpen ? "secondary" : "outline"}
      className={cn(
        "gap-2 shadow-lg transition-all duration-300",
        isOpen && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      <Monitor className="h-4 w-4" />
      <span className="hidden sm:inline">Preview</span>
    </Button>
  );
}
