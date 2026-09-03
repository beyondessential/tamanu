export function parseOrKeep(value: string): string | object {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
