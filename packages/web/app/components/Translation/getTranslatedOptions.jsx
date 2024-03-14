import { TranslatedText } from './TranslatedText';
import { camelCase } from 'lodash';
import React from 'react';

export const getTranslatedOptions = (options, prefix) => {
  if (!options) return [];
  return options.map(option => {
    if (typeof option.label !== 'string') return option;
    return {
      value: option.value,
      label: (
        <TranslatedText stringId={`${prefix}.${camelCase(option.label)}`} fallback={option.label} />
      ),
    };
  });
};
