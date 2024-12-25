import { camelCase } from 'es-toolkit';
import type { CamelCasedProperties } from 'type-fest';

export const objectToCamelCase = <T extends Record<string, unknown>>(obj: T): CamelCasedProperties<T> =>
  Object.entries(obj).reduce((state, [key, val]) => ({ ...state, [camelCase(key)]: val }), {}) as CamelCasedProperties<T>;
