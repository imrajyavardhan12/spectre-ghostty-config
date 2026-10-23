"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { LIFT } from "./FeatureRow";

const MIN_SIZE = 10;
const MAX_SIZE = 20;

/** A font-size row whose stepper drives a sample terminal, as the editor does. */
export function FontSizeDemo() {
  const [size, setSize] = useState(14);
  const step = "grid h-full w-[30px] place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  return (
    <div className={`flex flex-col gap-2.5 ${LIFT}`}>
      <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-3.5 py-3">
        <div className="flex-1">
          <div className="flex items-center gap-[7px] text-sm font-medium">
            Font size
            <span className="inline-flex h-[18px] items-center gap-1 rounded-full bg-accent px-1.5 text-[10.5px] text-accent-foreground">
              <span className="size-[5px] rounded-full bg-primary" aria-hidden="true" />
              Modified
            </span>
          </div>
          <div className="font-mono text-xs text-subtle-foreground">font-size</div>
        </div>
        <div className="flex h-8 items-center rounded-[7px] border border-input bg-field">
          <button type="button" aria-label="Smaller" disabled={size <= MIN_SIZE} onClick={() => setSize((n) => n - 1)} className={step}>
            <Minus className="size-[13px]" aria-hidden="true" />
          </button>
          <output aria-label="Font size" className="w-8 text-center font-mono text-[13px] font-medium">
            {size}
          </output>
          <button type="button" aria-label="Larger" disabled={size >= MAX_SIZE} onClick={() => setSize((n) => n + 1)} className={step}>
            <Plus className="size-[13px]" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="min-h-[150px] overflow-hidden rounded-[10px] bg-[#1a1b26] px-[18px] py-4 font-mono leading-[1.6] text-[#c0caf5] transition-[font-size] duration-200 motion-reduce:transition-none"
        style={{ fontSize: size }}
      >
        <div className="text-[#8089b3]"># theme = Tokyo Night</div>
        <div>
          <span className="text-[#7aa2f7]">❯</span> cargo test
        </div>
        <div>
          <span className="text-[#9ece6a]">ok</span> 214 passed
        </div>
        <div>
          <span className="text-[#7aa2f7]">❯</span>{" "}
          <span className="inline-block h-[1.1em] w-[0.6em] bg-[#c0caf5] align-[-0.2em]" />
        </div>
      </div>
      <div className="text-xs text-subtle-foreground">Try the stepper — the terminal follows.</div>
    </div>
  );
}
