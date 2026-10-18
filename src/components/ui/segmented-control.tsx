"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface SegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  "aria-labelledby"?: string
  "aria-label"?: string
  className?: string
}

/** A radio group drawn as joined segments: arrow keys move the choice, Tab leaves the group. */
function SegmentedControl({
  value,
  onValueChange,
  options,
  className,
  ...aria
}: SegmentedControlProps) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = options.findIndex((o) => o.value === value)
  const tabbableIndex = selectedIndex === -1 ? 0 : selectedIndex

  function move(from: number, step: number) {
    const next = (from + step + options.length) % options.length
    onValueChange(options[next].value)
    refs.current[next]?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      move(index, 1)
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      move(index, -1)
    } else if (event.key === "Home") {
      event.preventDefault()
      move(0, 0)
    } else if (event.key === "End") {
      event.preventDefault()
      move(options.length - 1, 0)
    }
  }

  return (
    <div
      role="radiogroup"
      data-slot="segmented-control"
      className={cn("flex gap-0.5 rounded-lg bg-muted p-0.5", className)}
      {...aria}
    >
      {options.map((option, index) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === tabbableIndex ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "h-7 min-w-0 flex-1 truncate rounded-md px-1.5 font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              checked
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
