"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Follows the user's reduced-motion preference, including a change while the page is open. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

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
  const [ref, inView] = useInView<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${inView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"} ${className}`}
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
        className={`inline-block h-3.5 w-2 translate-y-0.5 bg-current animate-pulse motion-reduce:animate-none transition-opacity duration-300 ${inView ? "opacity-70" : "opacity-0"}`}
        style={{ transitionDelay: `${lines.length * 0.45}s` }}
      />
    </div>
  );
}

/**
 * Tilts toward the pointer (up to 3° on X and 5° on Y) with a soft glare. Mouse only, wide screens
 * only, and skipped under reduced motion.
 */
export function Tilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (
      !el ||
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(min-width: 640px)").matches
    ) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.transform = `rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 10}deg)`;
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.dataset.hover = "1";
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    delete el.dataset.hover;
  };

  return (
    <div style={{ perspective: "1800px" }}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="group/tilt relative rounded-[14px] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform data-[hover]:duration-[120ms] data-[hover]:ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-300 group-data-[hover]/tilt:opacity-100"
          style={{
            background:
              "radial-gradient(600px circle at var(--gx, 50%) var(--gy, 0%), rgba(255,255,255,0.07), transparent 60%)",
          }}
        />
      </div>
    </div>
  );
}
