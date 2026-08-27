/** Canonicalize printed question labels so 11(a), 11.a, Q11 a, 11-A all match. */
export function normalizeQuestionNumber(raw: string | null | undefined): string {
  if (!raw) return "";

  const value = raw
    .trim()
    .toLowerCase()
    .replace(/^q(uestion)?\s*/i, "")
    .replace(/ans(wer)?\s*/i, "")
    .replace(/[.:)\]]+$/g, "")
    .replace(/\s+/g, "");

  const match = value.match(/^(\d+)\s*[-.(]*([a-z])\)?$/i);
  if (match) return `${match[1]}(${match[2].toLowerCase()})`;

  const numeric = value.match(/^(\d+)$/);
  if (numeric) return numeric[1];

  return value;
}

export function numbersEqual(a: string | null | undefined, b: string | null | undefined) {
  const left = normalizeQuestionNumber(a);
  const right = normalizeQuestionNumber(b);
  return Boolean(left) && left === right;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
