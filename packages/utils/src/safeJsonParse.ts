export const safeJsonParse = (s: string) => {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
};
