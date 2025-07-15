import { camelCase } from 'lodash';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

const specialCharacters = {
  '+': 'Plus',
  '@': 'At',
  '-': 'Dash',
  '/': 'Per',
  '%': 'Percent',
};

const formatOptionForStringId = str => camelCase(
    str.replace(
      new RegExp(`[${Object.keys(specialCharacters).join('')}]`, 'g'),
      match => `${specialCharacters[match]} `,
    ),
  );

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

export const getReferenceDataOptionStringId = (value, category, option) => {
  return `${getReferenceDataStringId(value, category)}.option.${formatOptionForStringId(option)}`;
};
