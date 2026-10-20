/** Saves the generated config as a file named `config`, which is what Ghostty reads. */
export function downloadConfigFile(contents: string): void {
  const blob = new Blob([contents], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "config";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Mobile browsers start the save after click() returns; revoking at once can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
