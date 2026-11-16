// Normalise a value to an array. Query-string parsers (qs) return a real array for repeated
// params, but degrade a long list past their arrayLimit to an index-keyed object
// ({ '0': ..., '1': ... }); both shapes, a bare value, and null/undefined all map to an array.
export const toArrayParam = <T>(
  value: T | T[] | Record<string, T> | null | undefined,
): T[] => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === 'object') return Object.values(value as Record<string, T>);
  return [value as T];
};
