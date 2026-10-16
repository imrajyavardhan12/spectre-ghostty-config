import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const kbdVariants = cva(
  "inline-flex select-none items-center gap-0.5 rounded-[5px] border font-mono font-medium leading-none",
  {
    variants: {
      variant: {
        // A key as part of a binding, e.g. ctrl + t
        default:
          "border-border-strong border-b-2 bg-field px-1.5 py-1 text-xs text-foreground",
        // A shortcut hint next to a control, e.g. ⌘K
        hint: "border-border bg-muted px-1.5 py-1 text-[11px] text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Kbd({
  className,
  variant,
  ...props
}: React.ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(kbdVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Kbd, kbdVariants }
