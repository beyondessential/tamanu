import { isPlainObject } from 'lodash';

export const camelify = (str: string) => {
  const [initial, ...subsequent] = str.split('_');
  const uppercased = subsequent.filter(x => x).map(s => s[0]?.toUpperCase() + s.slice(1));
  return [initial, ...uppercased].join('');
};

export const renameObjectKeys = <T extends Record<string, unknown>>(baseObject: T) => {
  return Object.keys(baseObject).reduce(
    (rebuilt, currentKey) => ({
      ...rebuilt,
      [camelify(currentKey)]: baseObject[currentKey],
    }),
    {} as T,
  );
};

export const deepRenameObjectKeys = <T extends Record<string, unknown>>(baseObject: T): T => {
  if (!isPlainObject(baseObject)) return baseObject;

  return Object.keys(baseObject).reduce(
    (rebuilt, currentKey) => ({
      ...rebuilt,
      [camelify(currentKey)]:
        typeof baseObject[currentKey] === 'object' && baseObject[currentKey] !== null
          ? deepRenameObjectKeys(baseObject[currentKey] as T)
          : baseObject[currentKey],
    }),
    {} as T,
  );
};
