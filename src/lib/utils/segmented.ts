/**
 * The longest label (in characters) a segmented control can show without cutting it off.
 * Segments share the control's width, so it shrinks as choices are added.
 */
const MAX_LABEL_LENGTH: Record<number, number> = { 2: 14, 3: 10, 4: 8 };

/**
 * Whether an enum fits a segmented control: two to four choices whose labels fit their
 * segment. Anything else stays in a select so the control never has to truncate.
 */
export function fitsSegmentedControl(labels: string[]): boolean {
  const longest = MAX_LABEL_LENGTH[labels.length];
  return longest !== undefined && labels.every((label) => label.length <= longest);
}
