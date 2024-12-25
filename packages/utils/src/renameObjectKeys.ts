import { type CamelCasedPropertiesDeep } from 'type-fest';
import { camelCase, isPlainObject } from 'es-toolkit';
import { objectToCamelCase } from './objectToCamelCase';


export const  renameObjectKeys = objectToCamelCase

export function deepRenameObjectKeys<T extends Record<string, unknown>>(baseObject: T): CamelCasedPropertiesDeep<T> {
  if (!isPlainObject(baseObject)) return baseObject;

  return Object.keys(baseObject).reduce(
    (rebuilt, currentKey) => ({
      ...rebuilt,
      [camelCase(currentKey)]: isPlainObject(baseObject[currentKey]) ? deepRenameObjectKeys(baseObject[currentKey]): baseObject[currentKey],
    }),
    {},
  ) as CamelCasedPropertiesDeep<T>
}

