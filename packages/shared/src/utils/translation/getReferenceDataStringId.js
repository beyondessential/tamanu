import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';
import { camelCase } from 'lodash';

const specialCharacters = {
  '+': 'Plus',
  '@': 'At',
  '-': 'Dash',
  '/': 'Per',
  '%': 'Percent',
  '.': 'Dot',
  ':': 'Colon',
  '=': 'Equals',
};

/**
 * Tries to replace special characters with words and then camelCases the result.
 * If no special character match, it just uses the original special character.
 * This ensures no duplicates when importing options while cleaning up most to readable strings
 * @example "A++" -> "APlusPlus"
 * @example "100/ml " -> "100PerMl"
 * @example "1.1" -> "1Dot1"
 */
const formatOptionForStringId = str =>
  camelCase(
    str.replace(
      new RegExp(`[${Object.keys(specialCharacters).join('')}]`, 'g'),
      match => `${specialCharacters[match]} `,
    ),
  );
  
/**
 * Returns the stringId for a reference data option.
 * @example getReferenceDataOptionStringId('question1', 'surveyScreenComponent', 'undecided') -> "refData.surveyScreenComponent.detail.question1.option.undecided"
 */
export const getReferenceDataOptionStringId = (value, category, option) => {
  return `${getReferenceDataStringId(value, category)}.option.${formatOptionForStringId(option)}`;
};

/**
 * Returns the stringId for a reference data value.
 * @example getReferenceDataStringId('O', 'bloodType') -> "refData.bloodType.o"
 */
export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};
