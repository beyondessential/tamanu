import { mapKeys, camelCase } from 'es-toolkit';
export const camelCaseProperties = <T extends Record<string, unknown>>(obj: T) =>
  mapKeys(obj, (_, key) => camelCase(key as string));
