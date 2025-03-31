import { TranslatedText } from './TranslatedText';
import React from 'react';

export const getTranslatedOptions = (options, prefix, TranslatedTextProps = {}) => {
  if (!options) return [];

  return options.map(option => {
    const { label, ...rest } = option;
    return typeof label === 'string'
      ? {
          label: (
            <TranslatedText
              stringId={`${prefix}.${label
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())}`}
              fallback={label}
              {...TranslatedTextProps}
              data-test-id='translatedtext-3i1j' />
          ),
          ...rest,
        }
      : option;
  });
};
