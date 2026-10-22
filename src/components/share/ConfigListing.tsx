import { Clock, FileCode2, ShieldAlert } from "lucide-react";

interface ConfigListingProps {
  config: string;
  /** Keys whose lines start a program. */
  programKeys: ReadonlySet<string>;
  /** Keys newer than the viewer's target, with the release that added each. */
  newerKeys: ReadonlyMap<string, string>;
}

/** "1.3.0" reads as "1.3"; a patch release keeps its number. */
export function shortVersion(version: string): string {
  return version.replace(/\.0$/, "");
}

/** The config as numbered lines, with a flag on any line that needs a second look. */
export function ConfigListing({ config, programKeys, newerKeys }: ConfigListingProps) {
  return (
    <div className="overflow-hidden rounded-[11px] border border-border bg-card">
      <div className="flex h-10 items-center gap-2 border-b border-border px-3.5 font-mono text-xs text-muted-foreground">
        <FileCode2 className="size-3.5" aria-hidden="true" />
        ~/.config/ghostty/config
      </div>
      <div
        role="region"
        aria-label="Config file contents"
        tabIndex={0}
        className="max-h-[560px] overflow-auto py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <pre className="w-max min-w-full font-mono text-[13px] leading-[1.8]">
          {config.split("\n").map((line, index) => {
            const equals = line.indexOf("=");
            const isSetting = !line.startsWith("#") && equals > 0;
            const key = isSetting ? line.slice(0, equals).trim() : "";
            const runsProgram = programKeys.has(key);
            const since = newerKeys.get(key);

            return (
              <div
                key={index}
                className={`flex items-center pr-3.5 ${runsProgram ? "bg-destructive-soft" : ""}`}
              >
                <span aria-hidden="true" className="w-[42px] shrink-0 pr-3.5 text-right text-subtle-foreground select-none">
                  {index + 1}
                </span>
                {isSetting ? (
                  <span className="whitespace-pre">
                    <span>{key}</span>
                    <span className="text-subtle-foreground"> = </span>
                    <span className="text-accent-foreground">{line.slice(equals + 1).replace(/^ /, "")}</span>
                  </span>
                ) : (
                  <span className="whitespace-pre text-subtle-foreground">{line || " "}</span>
                )}
                <span className="flex-1" />
                {(runsProgram || since) && (
                  <span className="ml-4 flex shrink-0 gap-1.5 font-sans">
                    {runsProgram && (
                      <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-destructive-border bg-destructive-soft px-[7px] py-0.5 text-[11px] font-medium text-destructive-foreground">
                        <ShieldAlert className="size-[11px]" aria-hidden="true" />
                        Runs a program
                      </span>
                    )}
                    {since && (
                      <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-muted px-[7px] py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Clock className="size-[11px]" aria-hidden="true" />
                        Needs {shortVersion(since)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
