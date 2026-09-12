import type { ImportAnalysis } from "@/lib/utils/config-import-analysis";
import {
  analyzeImportFile,
  type ImportFileError,
  type ImportFileLike,
} from "@/lib/utils/config-import-file";

export interface PendingImportFile {
  fileName: string;
  fileSize: number;
  currentSettingCount: number;
  analysis: ImportAnalysis;
}

interface ImportFileCoordinatorHandlers {
  getCurrentSettingCount: () => number;
  onStart: (token: number) => void;
  onSuccess: (pending: PendingImportFile) => void;
  onError: (error: ImportFileError) => void;
}

export class ImportFileCoordinator {
  private latestToken = 0;

  constructor(private readonly handlers: ImportFileCoordinatorHandlers) {}

  async select(file: ImportFileLike): Promise<void> {
    const token = ++this.latestToken;
    this.handlers.onStart(token);

    const result = await analyzeImportFile(
      file,
      () => token === this.latestToken
    );

    // The await above is an asynchronous publication boundary even when a
    // synchronous size rejection resolved the promise. Never publish an older
    // result after a newer selection has started.
    if (token !== this.latestToken || result.status === "stale") return;

    if (result.status === "error") {
      this.handlers.onError(result.error);
      return;
    }

    this.handlers.onSuccess({
      fileName: result.fileName,
      fileSize: result.fileSize,
      currentSettingCount: this.handlers.getCurrentSettingCount(),
      analysis: result.analysis,
    });
  }

  cancel(): void {
    this.latestToken += 1;
  }
}
