import Link from "next/link";
import { Button } from "@/components/ui/button";

interface UtilityActionsProps {
  /** Makes "Open editor" the quiet button, for pages whose primary action is something else. */
  editorSecondary?: boolean;
}

/** "Open editor" and "Go home", the way out of every utility page. */
export function UtilityActions({ editorSecondary = false }: UtilityActionsProps) {
  return (
    <>
      <Button asChild size="lg" variant={editorSecondary ? "outline" : "default"} className="px-3.5 text-sm">
        <Link href="/editor">Open editor</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="px-3.5 text-sm">
        <Link href="/">Go home</Link>
      </Button>
    </>
  );
}
