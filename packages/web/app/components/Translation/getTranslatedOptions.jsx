import { TranslatedText } from './TranslatedText';
import { camelCase } from 'lodash';
import React from 'react';

export const getTranslatedOptions = (options, prefix) => {
  if (!options) return [];
  return options.map(option => {
    const { label, value } = option;
    return typeof label === 'string'
      ? {
          value,
          label: <TranslatedText stringId={`${prefix}.${camelCase(label)}`} fallback={label} />,
        }
      : option;
  });
};
