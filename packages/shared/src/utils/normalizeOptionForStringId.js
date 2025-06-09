import { camelCase } from 'lodash';

export const normalizeOptionForStringId = option => {
  return camelCase(option.replace(/\s+/g, ''));
};