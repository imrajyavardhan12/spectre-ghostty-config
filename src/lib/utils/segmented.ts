/**
 * Whether an enum fits a segmented control: two to four short choices. Longer or
 * more numerous lists stay in a select so the control never has to truncate.
 */
export function fitsSegmentedControl(labels: string[]): boolean {
  if (labels.length < 2 || labels.length > 4) return false;
  const width = labels.reduce((total, label) => total + Math.max(label.length, 5), 0);
  return width <= 30 && labels.every((label) => label.length <= 14);
}
