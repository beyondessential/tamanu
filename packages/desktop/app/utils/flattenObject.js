import { isArray, isObject } from 'lodash';

/*
This helper function will return a flat object containing
the 'string path' of each value as keys. Besides making the
object flat, it will minimize the chance of namespace collisions
ocurring by prefixing keys accordingly.

i.e.

{
  a: 1,
  b: [2, 3, 4],
  c: { d: 5 },
}

Will become: 

{
  a: 1,
  b[0]: 2,
  b[1]: 3,
  b[2]: 4,
  c.d: 5,
}
*/
export const flattenObject = (obj, prefix = '') => {
  const flattened = {};
  const isObjArray = isArray(obj);
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = isObjArray ? `[${key}]` : key;
    const separator = isObjArray ? '' : '.';
    const prefixedKey = prefix ? `${prefix}${separator}${newKey}` : newKey;
    if (isObject(value)) Object.assign(flattened, flattenObject(value, prefixedKey));
    else flattened[prefixedKey] = value;
  });
  return flattened;
};
