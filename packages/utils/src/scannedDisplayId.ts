const MAX_SCANNED_LENGTH = 50;

const compilePattern = (pattern: string): RegExp | null => {
  try {
    return new RegExp(pattern);
  } catch {
    return null;
  }
};

/** Returns the trimmed display ID, or null when the scanned text is not one. */
export const parseScannedDisplayId = (raw: string, pattern?: string): string | null => {
  const value = raw.trim();
  if (!value || value.length > MAX_SCANNED_LENGTH) return null;
  if (!pattern) return value;
  return compilePattern(pattern)?.test(value) ? value : null;
};
