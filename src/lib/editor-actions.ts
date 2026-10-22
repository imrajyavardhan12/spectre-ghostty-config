export type EditorAction = "export" | "import" | "presets" | "themes";

type EditorActionHandlers = Partial<Record<EditorAction, () => void>>;

let handlers: EditorActionHandlers = {};

/**
 * The header owns the file, presets and navigation actions; the search palette offers them too.
 * The header registers its handlers while it is mounted, and the palette runs them by name.
 * Returns the cleanup.
 */
export function registerEditorActions(next: EditorActionHandlers): () => void {
  handlers = next;
  return () => {
    if (handlers === next) handlers = {};
  };
}

export function runEditorAction(action: EditorAction): void {
  handlers[action]?.();
}
