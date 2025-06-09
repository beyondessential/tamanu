import { camelCase } from 'lodash';

export const normaliseTextForStringId = (text: string) => {
  return camelCase(text.replace(/[^a-zA-Z0-9 ]/g, ''));
};