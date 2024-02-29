import { limon } from 'khmer-unicode-converter';
import { isNaN } from 'lodash';

function isNumeric(value) {
  return !isNaN(parseFloat(value));
}

export const numeralTranslation = numeral => {
  if (isNumeric(numeral)) return numeral;

  const latinNumerals = limon(numeral);
  if (isNumeric(latinNumerals)) return latinNumerals; // latinNumerals is always string

  return numeral;
};
