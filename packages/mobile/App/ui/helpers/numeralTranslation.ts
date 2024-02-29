import { limon } from 'khmer-unicode-converter';
import { isNaN } from 'lodash';

function isNumeric(value) {
  return !isNaN(parseFloat(value));
}

const numeralTranslation = (numeral: any) => {
  if (isNumeric(numeral)) return numeral;

  const latinNumerals = limon(numeral);
  if (isNumeric(latinNumerals)) return latinNumerals; // latinNumerals is always string

  return numeral;
};

export const yupAttemptTransformToNumber = (value: any, originalValue: any) => {
  const translationValue = numeralTranslation(originalValue);
  return isNumeric(translationValue) ? Number(translationValue) : value;
};
