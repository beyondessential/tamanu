import { limon } from 'khmer-unicode-converter';

import { isNaN } from 'lodash';

const isNumeric = (value: string) => {
  return !isNaN(parseFloat(value));
};

export const numeralTranslation = (numeral: string) => {
  if (isNumeric(numeral)) return numeral;

  const latinNumerals = limon(numeral);
  if (isNumeric(latinNumerals)) return latinNumerals; // latinNumerals is always string

  return numeral;
};
