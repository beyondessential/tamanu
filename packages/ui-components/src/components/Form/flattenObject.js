import { isArray, isObject } from 'lodash';
import { isValidElement } from 'react';

/** 
 * 
This helper function will return a flat object containing
the 'string path' of each value as keys. Besides making the
object flat, it will minimize the chance of namespace collisions
occurring by prefixing keys accordingly.

@example flattenObject({
    a: 1,
    b: [2, 3, 4],
    c: { d: 5 },
})  // returns: { a: 1, b[0]: 2, b[1]: 3, b[2]: 4, c.d: 5 }
*/

export const flattenObject = (obj, prefix = '') => {
  const flattened = {};
  const isObjArray = isArray(obj);
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = isObjArray ? `[${key}]` : key;
    const separator = isObjArray ? '' : '.';
    const prefixedKey = prefix ? `${prefix}${separator}${newKey}` : newKey;
    if (isObject(value) && !isValidElement(value))
      // stop it from trying to flatten react elements
      Object.assign(flattened, flattenObject(value, prefixedKey));
    else flattened[prefixedKey] = value;
  });
  return flattened;
};
