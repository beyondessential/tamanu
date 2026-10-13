//@ts-nocheck
// Todo: Setup translations
import React from 'react';
import { TranslationContext } from '@tamanu/ui-components';
import { replaceStringVariables } from '@tamanu/shared/utils/translation/translationFactory';

/** Until the portal loads translations, every string is its English fallback. */
const translationValue = {
  getTranslation: (_stringId, fallback, translationOptions) =>
    replaceStringVariables(fallback, translationOptions),
  getEnumTranslation: (enumValues, currentValue) => enumValues?.[currentValue] ?? null,
  getReferenceDataTranslation: ({ value, fallback, placeholder }) =>
    value ? fallback : placeholder,
  updateStoredLanguage: () => null,
  storedLanguage: '',
  translations: {},
};

export const TranslationProvider = ({ children }) => (
  <TranslationContext.Provider value={translationValue}>{children}</TranslationContext.Provider>
);
