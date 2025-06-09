import { camelCase } from 'lodash';

export const normalizeOptionForStringId = option => {
  return camelCase(option.replace(/[^a-zA-Z0-9 ]/g, ''));
};