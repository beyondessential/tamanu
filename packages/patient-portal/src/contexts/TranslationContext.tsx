/* eslint-disable @typescript-eslint/no-unused-vars */
//@ts-nocheck
// Todo: Setup translations
import React from 'react';
import { TranslationContext } from '@tamanu/ui-components';

export const TranslationProvider = ({ children }) => {
  return (
    <TranslationContext.Provider
      value={{
        getTranslation: (stringId, fallback) => {
          return fallback;
        },
        getEnumTranslation: (enumValues, currentValue) => enumValues?.[currentValue] ?? null,
        getReferenceDataTranslation: ({ value, fallback, placeholder }) =>
          value ? fallback : placeholder,
        updateStoredLanguage: () => null,
        storedLanguage: '',
        translations: {},
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
