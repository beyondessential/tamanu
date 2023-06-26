import { camelCase } from 'lodash';

export const objectToCamelCase = obj =>
  Object.entries(obj).reduce((state, [key, val]) => ({ ...state, [camelCase(key)]: val }), {});
