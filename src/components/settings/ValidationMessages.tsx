import { AlertCircle, AlertTriangle } from "lucide-react";
import type { ConfigValidationResult } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";

interface ValidationMessagesProps {
  result: ConfigValidationResult;
  className?: string;
}

/** An error means the typed text was not stored; the last valid value, or the default, stays in effect. */
export function ValidationMessages({ result, className }: ValidationMessagesProps) {
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      {result.errors.map((message) => (
        <p
          key={message}
          className="flex items-start gap-1.5 text-xs leading-[1.45] text-destructive-foreground"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Invalid.</strong> <span>{message}</span> Not applied until fixed.
          </span>
        </p>
      ))}
      {result.warnings.map((message) => (
        <p
          key={message}
          className="flex items-start gap-1.5 text-xs leading-[1.45] text-warning-foreground"
          role="status"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      ))}
    </div>
  );
}
