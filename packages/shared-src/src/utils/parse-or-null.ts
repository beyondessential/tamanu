export function parseOrNull(string?: string): null | any {
  if (!string) return null;

  try {
    return JSON.parse(string);
  } catch (e) {
    return null;
  }
}
