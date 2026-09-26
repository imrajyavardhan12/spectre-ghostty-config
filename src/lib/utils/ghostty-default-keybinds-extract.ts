// Evaluates Ghostty's `Keybinds.init` (src/config/Config.zig) for one
// platform to list the default keybinds Ghostty ships. It understands only
// the constructs that function uses and throws on anything else, so an
// upstream change fails loudly instead of producing a wrong table.

export type GhosttyPlatform = "macos" | "linux";

export interface GhosttyDefaultKeybind {
  /** Ghostty trigger syntax, modifiers ordered ctrl, alt, shift, super. */
  trigger: string;
  /** Ghostty action syntax, e.g. `copy_to_clipboard:mixed`. */
  action: string;
}

interface Env {
  darwin: boolean;
  vars: Map<string, unknown>;
}

const MOD_ORDER = ["ctrl", "alt", "shift", "super"] as const;

/** Extract the `Keybinds.init` function body from Config.zig source. */
export function extractKeybindsInitBody(source: string): string {
  const start = source.indexOf("pub fn init(self: *Keybinds, alloc: Allocator) !void {");
  if (start === -1) throw new Error("Keybinds.init not found in Config.zig");
  // Comments contain apostrophes that would read as char literals.
  const text = stripComments(source.slice(start));
  const open = text.indexOf("{");
  const close = matchingIndex(text, open);
  return text.slice(open + 1, close);
}

function stripComments(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      // Comments never appear inside string literals in this function.
      const index = line.indexOf("//");
      return index === -1 ? line : line.slice(0, index);
    })
    .join("\n");
}

const PAIRS: Record<string, string> = { "(": ")", "{": "}", "[": "]" };

/** Index of the bracket closing the one at `open`, skipping char/string literals. */
function matchingIndex(text: string, open: number): number {
  const stack: string[] = [];
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"') {
      i = skipLiteral(text, i);
      continue;
    }
    if (PAIRS[ch]) stack.push(PAIRS[ch]);
    else if (ch === ")" || ch === "}" || ch === "]") {
      if (stack.pop() !== ch) throw new Error(`Unbalanced "${ch}" at ${i}`);
      if (stack.length === 0) return i;
    }
  }
  throw new Error(`Unclosed "${text[open]}" at ${open}`);
}

function skipLiteral(text: string, start: number): number {
  const quote = text[start];
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === quote) return i;
  }
  throw new Error(`Unterminated literal at ${start}`);
}

/** Split on commas that are not nested inside brackets or literals. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"') {
      const end = skipLiteral(text, i);
      current += text.slice(i, end + 1);
      i = end;
      continue;
    }
    if (PAIRS[ch]) depth++;
    if (ch === ")" || ch === "}" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Parse `.{ .a = x, .b = y }` into its fields; positional items use their index. */
function structFields(expr: string): Map<string, string> {
  const text = expr.trim();
  if (!text.startsWith(".{") || !text.endsWith("}")) {
    throw new Error(`Expected struct literal: ${text}`);
  }
  const fields = new Map<string, string>();
  splitTopLevel(text.slice(2, -1)).forEach((part, index) => {
    const match = /^\.(\w+)\s*=\s*([\s\S]+)$/.exec(part);
    if (match) fields.set(match[1], match[2].trim());
    else fields.set(String(index), part);
  });
  return fields;
}

function evalCondition(cond: string, env: Env): boolean {
  const normalized = cond.replace(/\bcomptime\b/g, "").replace(/\s+/g, "");
  if (normalized === "builtin.target.os.tag.isDarwin()") return env.darwin;
  if (normalized === "!builtin.target.os.tag.isDarwin()") return !env.darwin;
  throw new Error(`Unsupported condition: ${cond}`);
}

function parseCharLiteral(literal: string): number {
  const match = /^'(\\?.)'$/u.exec(literal.trim());
  if (!match) throw new Error(`Unsupported char literal: ${literal}`);
  const body = match[1];
  return (body.length === 2 ? body[1] : body).codePointAt(0)!;
}

function evalInt(expr: string, env: Env): number {
  const text = expr.trim();
  if (/^-?\d+$/.test(text)) return Number(text);
  if (text === "(i - start) + 1") {
    return (env.vars.get("i") as number) - (env.vars.get("start") as number) + 1;
  }
  throw new Error(`Unsupported integer expression: ${text}`);
}

function evalMods(expr: string, env: Env): Set<string> {
  const text = expr.trim();
  if (text === "mods") {
    const mods = env.vars.get("mods");
    if (!(mods instanceof Set)) throw new Error("mods used before assignment");
    return new Set(mods as Set<string>);
  }
  const ctrlOrSuper = /^inputpkg\.ctrlOrSuper\(([\s\S]*)\)$/.exec(text);
  if (ctrlOrSuper) {
    const mods = evalMods(ctrlOrSuper[1], env);
    mods.add(env.darwin ? "super" : "ctrl");
    return mods;
  }
  const mods = new Set<string>();
  for (const [name, value] of structFields(text)) {
    if (!(MOD_ORDER as readonly string[]).includes(name) || value !== "true") {
      throw new Error(`Unsupported modifier field: .${name} = ${value}`);
    }
    mods.add(name);
  }
  return mods;
}

function evalKey(expr: string, env: Env): string {
  const fields = structFields(expr);
  const unicode = fields.get("unicode");
  if (unicode !== undefined) {
    const cp = unicode.trim() === "i" ? (env.vars.get("i") as number) : parseCharLiteral(unicode);
    return String.fromCodePoint(cp);
  }
  const physical = fields.get("physical");
  if (physical !== undefined) {
    const name = /^\.(\w+)$/.exec(physical.trim());
    if (name) return name[1];
    const digit = /^@field\(\s*inputpkg\.Key,\s*std\.fmt\.comptimePrint\("digit_\{u\}", \.\{i\}\),?\s*\)$/.exec(physical.trim());
    if (digit) return `digit_${String.fromCodePoint(env.vars.get("i") as number)}`;
  }
  throw new Error(`Unsupported key: ${expr}`);
}

function formatTrigger(expr: string, env: Env): string {
  const fields = structFields(expr);
  const key = fields.get("key");
  if (key === undefined) throw new Error(`Trigger without key: ${expr}`);
  const mods = fields.has("mods") ? evalMods(fields.get("mods")!, env) : new Set<string>();
  return [...MOD_ORDER.filter((mod) => mods.has(mod)), evalKey(key, env)].join("+");
}

function decodeZigString(literal: string): string {
  return JSON.parse(literal) as string;
}

function formatAction(expr: string, env: Env): string {
  const text = expr.trim();
  const bare = /^\.(\w+)$/.exec(text);
  if (bare) return bare[1];

  const fields = structFields(text);
  if (fields.size !== 1) throw new Error(`Unsupported action: ${text}`);
  const [[name, value]] = [...fields];
  const param = value.trim();
  if (param === "{}") return name;
  const enumValue = /^\.(\w+)$/.exec(param);
  if (enumValue) return `${name}:${enumValue[1]}`;
  if (param.startsWith('"')) return `${name}:${decodeZigString(param)}`;
  if (param.startsWith(".{")) {
    const items = [...structFields(param).values()].map((item) => item.replace(/^\./, ""));
    return `${name}:${items.join(",")}`;
  }
  return `${name}:${evalInt(param, env)}`;
}

function evalBlock(body: string, env: Env, out: GhosttyDefaultKeybind[]): void {
  let i = 0;
  const skipSpace = () => {
    while (i < body.length && /\s/.test(body[i])) i++;
  };

  for (;;) {
    skipSpace();
    if (i >= body.length) return;
    const rest = body.slice(i);

    if (rest.startsWith("{")) {
      const close = matchingIndex(body, i);
      evalBlock(body.slice(i + 1, close), { darwin: env.darwin, vars: new Map(env.vars) }, out);
      i = close + 1;
      continue;
    }

    if (rest.startsWith("if (") || rest.startsWith("if(")) {
      const condOpen = body.indexOf("(", i);
      const condClose = matchingIndex(body, condOpen);
      const blockOpen = body.indexOf("{", condClose);
      if (body.slice(condClose + 1, blockOpen).trim() !== "") throw new Error("Unsupported if form");
      const blockClose = matchingIndex(body, blockOpen);
      const taken = evalCondition(body.slice(condOpen + 1, condClose), env);
      let next = blockClose + 1;
      let elseBody: string | null = null;
      const after = body.slice(next).trimStart();
      if (after.startsWith("else")) {
        const elseOpen = body.indexOf("{", next);
        const elseClose = matchingIndex(body, elseOpen);
        elseBody = body.slice(elseOpen + 1, elseClose);
        next = elseClose + 1;
      }
      const chosen = taken ? body.slice(blockOpen + 1, blockClose) : elseBody;
      if (chosen !== null) evalBlock(chosen, { darwin: env.darwin, vars: new Map(env.vars) }, out);
      i = next;
      continue;
    }

    if (rest.startsWith("inline while")) {
      const header = /^inline while \(i <= end\) : \(i \+= 1\)\s*\{/.exec(rest);
      if (!header) throw new Error(`Unsupported loop: ${rest.slice(0, 60)}`);
      const blockOpen = i + header[0].length - 1;
      const blockClose = matchingIndex(body, blockOpen);
      const loopBody = body.slice(blockOpen + 1, blockClose);
      const start = env.vars.get("i") as number;
      const end = env.vars.get("end") as number;
      for (let cp = start; cp <= end; cp++) {
        const vars = new Map(env.vars);
        vars.set("i", cp);
        evalBlock(loopBody, { darwin: env.darwin, vars }, out);
      }
      i = blockClose + 1;
      continue;
    }

    const statementEnd = findStatementEnd(body, i);
    const statement = body.slice(i, statementEnd).trim();
    i = statementEnd + 1;
    evalStatement(statement, env, out);
  }
}

function findStatementEnd(text: string, start: number): number {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" || ch === '"') {
      i = skipLiteral(text, i);
      continue;
    }
    if (PAIRS[ch]) depth++;
    if (ch === ")" || ch === "}" || ch === "]") depth--;
    if (ch === ";" && depth === 0) return i;
  }
  throw new Error(`Unterminated statement at ${start}`);
}

function evalStatement(statement: string, env: Env, out: GhosttyDefaultKeybind[]): void {
  // State resets at the top of init (self.set = .{}; ...).
  if (/^self\.\w+ = [\s\S]+$/.test(statement)) return;

  const put = /^try self\.set\.(put|putFlags)\(([\s\S]*)\)$/.exec(statement);
  if (put) {
    const args = splitTopLevel(put[2]);
    const expected = put[1] === "put" ? 3 : 4;
    if (args.length !== expected || args[0] !== "alloc") {
      throw new Error(`Unexpected ${put[1]} arguments: ${statement}`);
    }
    out.push({ trigger: formatTrigger(args[1], env), action: formatAction(args[2], env) });
    return;
  }

  const modsDecl = /^const mods: inputpkg\.Mods = if \(([^)]*\(\))\)\s*([\s\S]+?)\s+else\s+([\s\S]+)$/.exec(statement);
  if (modsDecl) {
    const chosen = evalCondition(modsDecl[1], env) ? modsDecl[2] : modsDecl[3];
    env.vars.set("mods", evalMods(chosen, env));
    return;
  }

  const charDecl = /^(?:const|comptime var) (\w+): u21 = ('(?:\\.|.)'|\w+)$/.exec(statement);
  if (charDecl) {
    const [, name, value] = charDecl;
    env.vars.set(name, value.startsWith("'") ? parseCharLiteral(value) : env.vars.get(value));
    return;
  }

  throw new Error(`Unsupported statement: ${statement.slice(0, 80)}`);
}

/**
 * Evaluate `Keybinds.init` for a platform and return the effective defaults.
 * Later puts replace earlier ones for the same trigger, as in Ghostty.
 */
export function evaluateGhosttyDefaultKeybinds(
  initBody: string,
  platform: GhosttyPlatform
): GhosttyDefaultKeybind[] {
  const puts: GhosttyDefaultKeybind[] = [];
  evalBlock(initBody, { darwin: platform === "macos", vars: new Map() }, puts);

  const effective = new Map<string, GhosttyDefaultKeybind>();
  for (const binding of puts) {
    effective.delete(binding.trigger);
    effective.set(binding.trigger, binding);
  }
  return [...effective.values()];
}
