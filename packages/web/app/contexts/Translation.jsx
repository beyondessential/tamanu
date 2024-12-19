import React, { useContext, useState } from 'react';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';
import { translationFactory } from '@tamanu/shared/utils/translation/translationFactory';
import { getCurrentLanguageCode } from '../utils/translation';

/**
 * @typedef {Object} TranslationOptions
 * @property {Object} replacements - Object containing key-value pairs to replace in the translation string
 * @property {'lower' | 'upper' | 'sentence'} casing - Casing to apply to the translation string
 */

export const TranslationContext = React.createContext(null);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation has been called outside a TranslationProvider.');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());

  const { data: translations } = useTranslations(storedLanguage);

  const translationFunc = translationFactory(translations);

  /**
   * @param {string} stringId
   * @param {string} fallback
   * @param {TranslationOptions} translationOptions
   * @returns {string}
   */
  const getTranslation = (stringId, fallback, translationOptions = {}) => {
    const { value } = translationFunc(stringId, fallback, translationOptions);
    return value;
  };

  const updateStoredLanguage = newLanguage => {
    // Save the language in local state so that it updates the react component tree on change
    setStoredLanguage(newLanguage);
    // Save the language in local storage so that it persists between sessions
    localStorage.setItem(LOCAL_STORAGE_KEYS.LANGUAGE, newLanguage);
  };

  return (
    <TranslationContext.Provider
      value={{
        getTranslation,
        updateStoredLanguage,
        storedLanguage,
        translations,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
