import { Reveal } from "./motion";

interface FeatureRowProps {
  /** "01 — Live preview" */
  label: string;
  title: string;
  body: string;
  /** Puts the text on the right at desktop width, so rows alternate. */
  flip?: boolean;
  children: React.ReactNode;
}

/** One feature: the words on one side, a live piece of the product on the other. */
export function FeatureRow({ label, title, body, flip = false, children }: FeatureRowProps) {
  return (
    <Reveal className="grid items-center gap-8 border-t border-border py-12 md:py-[72px] lg:grid-cols-2 lg:gap-20">
      <div className={`max-w-[440px] ${flip ? "lg:order-2" : ""}`}>
        <div className="font-mono text-xs font-medium text-subtle-foreground">{label}</div>
        <h2 className="mt-3 text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] md:text-[32px]">{title}</h2>
        <p className="mt-3.5 text-base leading-[1.6] text-pretty text-muted-foreground">{body}</p>
      </div>
      {children}
    </Reveal>
  );
}

const LIFT_BASE = "transition-transform duration-[250ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none";

/** The lift the feature visuals share on hover. */
export const LIFT = `${LIFT_BASE} motion-safe:hover:-translate-y-[3px]`;

/** A smaller lift for the small cards. */
export const LIFT_SMALL = `${LIFT_BASE} motion-safe:hover:-translate-y-0.5`;
