import { describe, expect, it } from "vitest";
import { findSensitiveSettings } from "@/lib/security/sensitive-options";

describe("findSensitiveSettings", () => {
  it("flags options that run programs or inject input, with their values", () => {
    expect(
      findSensitiveSettings({
        "initial-command": "htop",
        command: "/bin/zsh -l",
        env: ["FOO=bar", "PATH=/tmp"],
        input: "raw:ls\\n",
        "config-file": "?extra.conf",
        "font-size": 14,
      })
    ).toEqual([
      { key: "command", values: ["/bin/zsh -l"], reason: "runs-program" },
      { key: "config-file", values: ["?extra.conf"], reason: "runs-program" },
      { key: "env", values: ["FOO=bar", "PATH=/tmp"], reason: "runs-program" },
      { key: "initial-command", values: ["htop"], reason: "runs-program" },
      { key: "input", values: ["raw:ls\\n"], reason: "runs-program" },
    ]);
  });

  it("flags only the values that weaken clipboard protections", () => {
    expect(
      findSensitiveSettings({
        "clipboard-read": "allow",
        "clipboard-write": "deny",
        "clipboard-paste-protection": false,
      })
    ).toEqual([
      { key: "clipboard-paste-protection", values: ["false"], reason: "weakens-protection" },
      { key: "clipboard-read", values: ["allow"], reason: "weakens-protection" },
    ]);
  });

  it("returns nothing for ordinary appearance settings", () => {
    expect(
      findSensitiveSettings({
        background: "#000000",
        "clipboard-paste-protection": true,
        "font-family": ["JetBrains Mono"],
      })
    ).toEqual([]);
  });
});
