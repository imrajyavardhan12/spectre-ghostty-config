import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 items-center justify-center border px-[7px] text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-[color,background-color] overflow-hidden",
  {
    variants: {
      variant: {
        // Sage tint: "this is yours" (modified, applied)
        default:
          "rounded-full border-transparent bg-accent text-accent-foreground",
        secondary:
          "rounded-[5px] border-transparent bg-muted text-muted-foreground [a&]:hover:text-foreground",
        destructive:
          "rounded-[5px] border-destructive-border bg-destructive-soft text-destructive-foreground",
        warning:
          "rounded-[5px] border-warning-border bg-warning-soft text-warning-foreground",
        // Tags: version, platform
        outline:
          "rounded-xs border-border text-muted-foreground [a&]:hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
