import { customAlphabet } from 'nanoid';

const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

export const generateDisplayId = () => {
  const generator = customAlphabet(ALPHABET_FOR_ID, 7);
  return generator();
};
