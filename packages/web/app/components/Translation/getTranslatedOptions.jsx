import { TranslatedText } from './TranslatedText';
import React from 'react';
import { toCamelCase } from '@tamanu/shared/utils/enumRegistry';

export const getTranslatedOptions = (options, prefix, TranslatedTextProps = {}) => {
  if (!options) return [];

  return options.map((option, index) => {
    const { label, ...rest } = option;
    return typeof label === 'string'
      ? {
          label: (
            <TranslatedText
              stringId={`${prefix}.${toCamelCase(label)}`}
              fallback={label}
              {...TranslatedTextProps}
              data-testid={`translatedtext-x1yr-${index}`}
            />
          ),
          ...rest,
        }
      : option;
  });
};
