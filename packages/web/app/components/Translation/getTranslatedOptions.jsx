import { TranslatedText } from './TranslatedText';
import { camelCase } from 'lodash';
import React from 'react';

export const getTranslatedOptions = (options, prefix) => {
  if (!options) return [];
  return options.map(option => {
    const { label, ...rest } = option;
    return typeof label === 'string'
      ? {
          label: <TranslatedText stringId={`${prefix}.${camelCase(label)}`} fallback={label} />,
          ...rest,
        }
      : option;
  });
};
