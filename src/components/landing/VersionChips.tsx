"use client";

import { useState } from "react";

const VERSIONS = ["1.0", "1.1", "1.2", "1.3"];

export function VersionChips() {
  const [selected, setSelected] = useState(VERSIONS.length - 1);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {VERSIONS.map((version, i) => (
          <button
            key={version}
            type="button"
            aria-pressed={i === selected}
            onClick={() => setSelected(i)}
            className={`rounded-full border px-4 py-2 font-mono text-sm transition-all duration-300 hover:-translate-y-0.5 ${i === selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            Ghostty {version}
          </button>
        ))}
      </div>
      <p
        key={selected}
        aria-live="polite"
        className="mt-4 animate-fade-in text-xs text-muted-foreground motion-reduce:animate-none"
      >
        {selected === VERSIONS.length - 1
          ? "Every option is shown."
          : `Options added after Ghostty ${VERSIONS[selected]} are hidden.`}
      </p>
    </div>
  );
}
