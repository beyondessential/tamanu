import React, { useContext, useState } from 'react';
import { useApi } from '../api/useApi';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useTranslations } from '../api/queries/useTranslations';
import { ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';
import { lowerCase } from 'lodash';

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
const replaceStringVariables = (templateString, replacements, translations) => {
  if (!replacements) return templateString;
  console.log(replacements);
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      // Return the replacement if exists
      let replacement = replacements[part.slice(1)] || part;
      if (typeof replacement !== 'object') return replacement;

      // is react node
      const child = replacement.props.children;
      if (child?.props?.stringId) {
        replacement = child;
      }
      const translation = translations?.[replacement.props.stringId] || replacement.props.fallback;
      if (replacement.props.lowercase) return lowerCase(translation);
      else return translation;
    })
    .join('');

  return result;
};

export const TranslationProvider = ({ children }) => {
  const api = useApi();
  const initialValue = localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) || ENGLISH_LANGUAGE_CODE;
  const [storedLanguage, setStoredLanguage] = useState(initialValue);

  const { data: translations } = useTranslations(storedLanguage);

  const getTranslation = (stringId, fallback, replacements) => {
    if (!translations) return replaceStringVariables(fallback, replacements, translations);
    if (translations[stringId])
      return replaceStringVariables(translations[stringId], replacements, translations);
    // This section here is a dev tool to help populate the db with the translation ids we have defined
    // in components. It will only populate the db with English strings, so that we can then translate them.
    if (isDev && storedLanguage === ENGLISH_LANGUAGE_CODE) {
      api.post('translation', { stringId, fallback, text: fallback });
    }
    return replaceStringVariables(fallback, replacements, translations);
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
