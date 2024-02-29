import React, { useContext, useState } from 'react';
import { useApi } from '../api/useApi';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';

export const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

const isDev = process.env.NODE_ENV === 'development';

/**
 * @param {string} template 
 * @param {object} replacements 
 * @returns {string}
 * 
 * @example replacePlaceholders("there are {{count}} users", { count: 2 }) => "there are 2 users"
 */
function replacePlaceholders(template, replacements) {
  if (!replacements) return template;
  return template.replace(/{{(.*?)}}/g, (match, p1) => replacements?.[p1] ?? match);
}

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const initialValue = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) || 'en';
  const [storedLanguage, setStoredLanguage] = useState(initialValue);

  const { data: translations } = useTranslations(storedLanguage);

  const getTranslation = (stringId, fallback, placeholderData) => {
    if (!translations) return replacePlaceholders(fallback, placeholderData);
    if (translations[stringId]) return replacePlaceholders(translations[stringId], placeholderData);
    // This section here is a dev tool to help populate the db with the translation ids we have defined
    // in components. It will only populate the db with English strings, so that we can then translate them.
    if (isDev && storedLanguage === 'en') {
      api.post('translation', { stringId, fallback, text: fallback });
    }
    return replacePlaceholders(fallback, placeholderData);
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
