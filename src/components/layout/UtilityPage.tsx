import type { ReactNode } from "react";

interface UtilityPageProps {
  /** The command the terminal card shows, after the prompt. */
  command: string;
  /** What the command printed. The card is decorative and hidden from screen readers, so the text below must say the same. */
  output: string;
  /** Errors print in the destructive color, a plain miss stays muted. */
  tone?: "error" | "muted";
  /** A short label above the title, such as "404". */
  code: string;
  title: string;
  children: ReactNode;
  /** The buttons under the text. */
  actions: ReactNode;
  /** Small print under the buttons. */
  footer?: ReactNode;
}

/** The terminal-style card and text shared by the 404, error and invalid-link pages. */
export function UtilityPage({ command, output, tone = "muted", code, title, children, actions, footer }: UtilityPageProps) {
  return (
    <main className="grid flex-1 place-items-center px-5 py-10 sm:px-8 sm:py-16">
      <div className="flex w-full max-w-[460px] flex-col items-start gap-4">
        <div aria-hidden="true" className="w-full rounded-[10px] border border-border bg-card px-4 py-3.5 font-mono text-[13px] leading-[1.75]">
          <div className="break-all">
            <span className="text-primary">❯</span> {command}
          </div>
          <div className={`break-words ${tone === "error" ? "text-destructive-foreground" : "text-muted-foreground"}`}>{output}</div>
        </div>
        <div className="font-mono text-xs font-medium text-subtle-foreground">{code}</div>
        <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] sm:text-[32px]">{title}</h1>
        <p className="text-[15px] leading-[1.6] text-pretty text-muted-foreground">{children}</p>
        <div className="mt-1 flex flex-wrap gap-2">{actions}</div>
        {footer && <div className="text-xs text-subtle-foreground">{footer}</div>}
      </div>
    </main>
  );
}
