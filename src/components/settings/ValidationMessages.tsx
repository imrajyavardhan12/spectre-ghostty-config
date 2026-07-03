import { AlertCircle, AlertTriangle } from "lucide-react";
import type { ConfigValidationResult } from "@/lib/utils/config-validation";
import { cn } from "@/lib/utils";

interface ValidationMessagesProps {
  result: ConfigValidationResult;
  className?: string;
}

export function ValidationMessages({ result, className }: ValidationMessagesProps) {
  if (result.errors.length === 0 && result.warnings.length === 0) {
    return null;
  }

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      {result.errors.map((message) => (
        <p key={message} className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </p>
      ))}
      {result.warnings.map((message) => (
        <p key={message} className="flex items-start gap-1.5 text-xs text-amber-500" role="status">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{message}</span>
        </p>
      ))}
    </div>
  );
}
