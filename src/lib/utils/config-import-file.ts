import type { ImportAnalysis } from "@/lib/utils/config-import-analysis";
import { analyzeGhosttyConfig } from "@/lib/utils/config-import-analysis";

export const IMPORT_FILE_LIMITS = {
  maxBytes: 1_048_576,
  maxLines: 10_000,
  maxLineLength: 65_536,
} as const;

export interface ImportFileLike {
  name: string;
  size: number;
  text: () => Promise<string>;
}

export type ImportFileErrorCode =
  | "file-too-large"
  | "too-many-lines"
  | "line-too-long"
  | "likely-binary"
  | "file-read-failed";

export interface ImportFileError {
  code: ImportFileErrorCode;
  message: string;
}

export type ImportFileAnalysisResult =
  | {
      status: "success";
      fileName: string;
      fileSize: number;
      analysis: ImportAnalysis;
    }
  | { status: "error"; error: ImportFileError }
  | { status: "stale" };

const FILE_TOO_LARGE: ImportFileError = {
  code: "file-too-large",
  message: "Choose a config file no larger than 1 MiB.",
};

const FILE_READ_FAILED: ImportFileError = {
  code: "file-read-failed",
  message: "Spectre could not read this file. Choose a readable local config file and try again.",
};

export function validateImportSourceText(source: string): ImportFileError | null {
  // Line totals count content lines: a trailing newline terminates the last
  // line instead of starting a new one, so "a\n" is 1 line, not 2. The
  // in-loop limit allows one extra line to avoid rejecting an exactly
  // 10,000-line newline-terminated file before the trailing-newline
  // adjustment below can apply.
  let lineCount = source.length === 0 ? 0 : 1;
  let lineLength = 0;

  for (const character of source) {
    if (character === "\0") {
      return {
        code: "likely-binary",
        message: "This file contains a NUL byte and appears to be binary.",
      };
    }

    if (character === "\n") {
      lineCount += 1;
      if (lineCount > IMPORT_FILE_LIMITS.maxLines + 1) {
        return {
          code: "too-many-lines",
          message: `Config files may contain at most ${IMPORT_FILE_LIMITS.maxLines.toLocaleString()} lines.`,
        };
      }
      lineLength = 0;
      continue;
    }

    lineLength += 1;
    if (lineLength > IMPORT_FILE_LIMITS.maxLineLength) {
      return {
        code: "line-too-long",
        message: `Each config line must be at most ${IMPORT_FILE_LIMITS.maxLineLength.toLocaleString()} characters.`,
      };
    }
  }

  if (source.endsWith("\n")) {
    lineCount -= 1;
  }
  if (lineCount > IMPORT_FILE_LIMITS.maxLines) {
    return {
      code: "too-many-lines",
      message: `Config files may contain at most ${IMPORT_FILE_LIMITS.maxLines.toLocaleString()} lines.`,
    };
  }

  return null;
}

export async function analyzeImportFile(
  file: ImportFileLike,
  isCurrent: () => boolean = () => true
): Promise<ImportFileAnalysisResult> {
  if (file.size > IMPORT_FILE_LIMITS.maxBytes) {
    return { status: "error", error: FILE_TOO_LARGE };
  }

  let source: string;
  try {
    source = await file.text();
  } catch {
    return isCurrent()
      ? { status: "error", error: FILE_READ_FAILED }
      : { status: "stale" };
  }

  // Check immediately after the only asynchronous boundary, before scanning or
  // analyzing source that has already been superseded by a newer selection.
  if (!isCurrent()) return { status: "stale" };

  const sourceError = validateImportSourceText(source);
  if (sourceError) return { status: "error", error: sourceError };

  // analyzeGhosttyConfig is pure and linear over bounded input, so this
  // should never throw. Guard the fire-and-forget coordinator path anyway so
  // an unexpected failure surfaces as a local error instead of an unhandled
  // rejection with the UI stuck in loading state.
  try {
    return {
      status: "success",
      fileName: file.name,
      fileSize: file.size,
      analysis: analyzeGhosttyConfig(source),
    };
  } catch {
    return { status: "error", error: FILE_READ_FAILED };
  }
}
