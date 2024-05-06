import React, { useContext, useState } from 'react';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';
import { getCurrentLanguageCode } from '../utils/translation';

export const TranslationContext = React.createContext();

export const useTranslation = () => useContext(TranslationContext);

const applyCasing = (text, lowercase, uppercase) => {
  if (lowercase) return text.toLowerCase();
  if (uppercase) return text.toUpperCase();
  return text;
};

/**
 * @param {string} templateString
 * @param {object} replacements
 * @returns {string}
 *
 * @example replaceStringVariables("there are :count users", { count: 2 }) => "there are 2 users"
 */
export const replaceStringVariables = (
  templateString,
  { replacements, uppercase, lowercase },
  translations,
) => {
  if (!replacements) return applyCasing(templateString, uppercase, lowercase);
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      // Return the replacement if exists
      let replacement = replacements[part.slice(1)] ?? part;
      if (typeof replacement !== 'object') return replacement;

      const translation = translations?.[replacement.props.stringId] || replacement.props.fallback;
      return applyCasing(translation, replacement.props.lowercase, replacement.props.uppercase);
    })
    .join('');

  return applyCasing(result, uppercase, lowercase);
};

export const TranslationProvider = ({ children }) => {
  const [storedLanguage, setStoredLanguage] = useState(getCurrentLanguageCode());

  const { data: translations } = useTranslations(storedLanguage);

  const getTranslation = (stringId, fallback, replacements, uppercase, lowercase) => {
    const replacementConfig = {
      replacements,
      uppercase,
      lowercase,
    };
    if (!translations) return replaceStringVariables(fallback, replacementConfig, translations);
    if (translations[stringId])
      return replaceStringVariables(translations[stringId], replacementConfig, translations);
    return replaceStringVariables(
      fallback,
      {
        replacements,
        uppercase,
        lowercase,
      },
      translations,
    );
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
