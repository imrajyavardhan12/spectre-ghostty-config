import { describe, expect, it, vi } from "vitest";
import {
  IMPORT_FILE_LIMITS,
  analyzeImportFile,
  validateImportSourceText,
  type ImportFileLike,
} from "@/lib/utils/config-import-file";

function createFile(
  overrides: Partial<ImportFileLike> = {}
): ImportFileLike {
  return {
    name: "config",
    size: 32,
    text: vi.fn(async () => "font-size = 16"),
    ...overrides,
  };
}

describe("config import file analysis", () => {
  it("accepts an extensionless config at the exact byte limit", async () => {
    const file = createFile({ size: IMPORT_FILE_LIMITS.maxBytes });

    const result = await analyzeImportFile(file);

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.fileName).toBe("config");
    expect(result.fileSize).toBe(IMPORT_FILE_LIMITS.maxBytes);
    expect(result.analysis.candidateConfig["font-size"]).toBe(16);
    expect(file.text).toHaveBeenCalledTimes(1);
  });

  it("rejects one byte over the limit before reading", async () => {
    const file = createFile({ size: IMPORT_FILE_LIMITS.maxBytes + 1 });

    const result = await analyzeImportFile(file);

    expect(result).toMatchObject({
      status: "error",
      error: { code: "file-too-large" },
    });
    expect(file.text).not.toHaveBeenCalled();
  });

  it("enforces exact line-count and line-length boundaries", () => {
    const tenThousandLines = Array.from(
      { length: IMPORT_FILE_LIMITS.maxLines },
      () => "#"
    ).join("\n");
    const tenThousandAndOneLines = `${tenThousandLines}\n#`;
    const longestLine = "x".repeat(IMPORT_FILE_LIMITS.maxLineLength);
    const overlongLine = `${longestLine}x`;

    expect(validateImportSourceText(tenThousandLines)).toBeNull();
    expect(validateImportSourceText(tenThousandAndOneLines)).toMatchObject({
      code: "too-many-lines",
    });
    expect(validateImportSourceText(longestLine)).toBeNull();
    expect(validateImportSourceText(overlongLine)).toMatchObject({
      code: "line-too-long",
    });
  });

  it("counts a trailing newline as a terminator, not an extra line", () => {
    const tenThousandTerminated =
      `${Array.from({ length: IMPORT_FILE_LIMITS.maxLines }, () => "#").join("\n")}\n`;
    const tenThousandAndOneTerminated = `${tenThousandTerminated}#\n`;

    expect(validateImportSourceText("")).toBeNull();
    expect(validateImportSourceText(tenThousandTerminated)).toBeNull();
    expect(validateImportSourceText(tenThousandAndOneTerminated)).toMatchObject({
      code: "too-many-lines",
    });
  });

  it.each([
    ["start", "\0font-size = 16"],
    ["middle", "font\0-size = 16"],
    ["end", "font-size = 16\0"],
  ])("rejects a NUL byte at the %s", (_position, source) => {
    expect(validateImportSourceText(source)).toMatchObject({
      code: "likely-binary",
    });
  });

  it("rejects over-limit line counts and lengths through the full file path", async () => {
    const tooManyLines = `${"#\n".repeat(IMPORT_FILE_LIMITS.maxLines)}#`;
    const tooLongLine = "x".repeat(IMPORT_FILE_LIMITS.maxLineLength + 1);

    for (const source of [tooManyLines, tooLongLine]) {
      const file = createFile({
        size: source.length,
        text: async () => source,
      });
      const result = await analyzeImportFile(file);
      expect(result.status).toBe("error");
    }
  });

  it("returns a local error when the browser cannot read the file", async () => {
    const file = createFile({
      text: vi.fn(async () => {
        throw new DOMException("Denied", "NotReadableError");
      }),
    });

    const result = await analyzeImportFile(file);

    expect(result).toMatchObject({
      status: "error",
      error: { code: "file-read-failed" },
    });
  });
});
