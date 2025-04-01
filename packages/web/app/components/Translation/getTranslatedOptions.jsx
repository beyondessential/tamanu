import { TranslatedText } from './TranslatedText';
import React from 'react';

export const getTranslatedOptions = (options, prefix, TranslatedTextProps = {}) => {
  if (!options) return [];

  return options.map((option, index) => {
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
              data-testid={`translatedtext-x1yr-${index}`} />
          ),
          ...rest,
        }
      : option;
  });
};
