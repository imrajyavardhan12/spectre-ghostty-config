import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground border-input bg-field h-[34px] w-full min-w-0 rounded-md border px-2.5 py-1 text-base transition-[color,border-color,box-shadow] duration-150 ease-out outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:opacity-70 md:text-[13px]",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-accent",
        "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive-soft",
        className
      )}
      {...props}
    />
  )
}

export { Input }
