import React, { useContext, useState } from 'react';
import { useApi } from '../api/useApi';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';
import { getCurrentLanguageCode } from '../utils/translation';

export const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

const isDev = process.env.NODE_ENV === 'development';

/**
 * @param {string} templateString
 * @param {object} replacements
 * @returns {string}
 *
 * @example replaceStringVariables("there are :count users", { count: 2 }) => "there are 2 users"
 */
const replaceStringVariables = (templateString, replacements) => {
  if (!replacements) return templateString;
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      // Return the replacement if exists
      return replacements[part.slice(1)] || part;
    })
    .join('');

  return result;
};

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());

  const { data: translations } = useTranslations(storedLanguage);

  const getTranslation = (stringId, fallback, replacements) => {
    if (!translations) return replaceStringVariables(fallback, replacements);
    if (translations[stringId]) return replaceStringVariables(translations[stringId], replacements);
    // This section here is a dev tool to help populate the db with the translation ids we have defined
    // in components. It will only populate the db with English strings, so that we can then translate them.
    if (isDev && storedLanguage === 'en') {
      api.post('translation', { stringId, fallback, text: fallback });
    }
    return replaceStringVariables(fallback, replacements);
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
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
