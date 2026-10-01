"use client";

import { useEffect, useRef, useState } from "react";

/** Becomes true the first time the element is mostly on screen. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/** Fades and lifts its children in when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

/** Lines that appear one after another once scrolled into view, then a blinking cursor. */
export function TypeLines({ lines }: { lines: React.ReactNode[] }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref}>
      {lines.map((line, i) => (
        <div
          key={i}
          className={`motion-reduce:animate-none motion-reduce:opacity-100 ${inView ? "animate-fade-up [animation-fill-mode:backwards]" : "opacity-0"}`}
          style={{ animationDelay: `${i * 0.45}s` }}
        >
          {line}
        </div>
      ))}
      <span
        className={`inline-block h-3.5 w-2 translate-y-0.5 bg-current animate-pulse transition-opacity duration-300 ${inView ? "opacity-70" : "opacity-0"}`}
        style={{ transitionDelay: `${lines.length * 0.45}s` }}
      />
    </div>
  );
}

/** Tilts toward the pointer with a soft glare. Mouse only, and skipped under reduced motion. */
export function Tilt({ children, max = 4 }: { children: React.ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${-y * max * 2}deg) rotateY(${x * max * 2}deg) scale(1.01)`;
    el.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
    el.dataset.hover = "1";
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    delete el.dataset.hover;
  };

  return (
    <div style={{ perspective: "1200px" }}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group/tilt relative transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[hover]:duration-100 data-[hover]:ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-data-[hover]/tilt:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.09), transparent 60%)",
          }}
        />
      </div>
    </div>
  );
}
