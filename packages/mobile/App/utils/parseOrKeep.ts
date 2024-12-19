export function parseOrKeep(value: string): string | object {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}
