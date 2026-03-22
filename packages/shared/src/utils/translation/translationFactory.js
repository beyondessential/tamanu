import { upperFirst } from 'lodash';

const applyCasing = (text, casing) => {
  if (!casing) return text;
  if (casing === 'lower') return text.toLocaleLowerCase();
  if (casing === 'upper') return text.toLocaleUpperCase();
  if (casing === 'sentence') return upperFirst(text);
  throw new Error(`applyCasing called with unhandled value: ${casing}`);
};

/**
 * @typedef {Object} TranslationOptions
 * @property {Object} replacements - Object containing key-value pairs to replace in the translation string
 * @property {'lower' | 'upper' | 'sentence'} casing - Casing to apply to the translation string
 */

/**
 * @param {string} templateString
 * @param {TranslationOptions} translationOptions
 * @param {Object} translations
 * @returns {string}
 *
 * @example replaceStringVariables("there are :count users", { replacements: { count: 2 } }) => "there are 2 users"
 */
export const replaceStringVariables = (templateString, { replacements, casing } = {}, translations) => {
  if (!replacements) return applyCasing(templateString, casing);
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      // Return the replacement if exists
      let replacement = replacements[part.slice(1)] ?? part;
      if (typeof replacement !== 'object') return replacement;

      const translation = translations?.[replacement.props.stringId] || replacement.props.fallback;
      return applyCasing(translation, replacement.props.casing);
    })
    .join('');

  return applyCasing(result, casing);
};

export const translationFactory = (translations) => (stringId, fallback, translationOptions) => {
  if (!translations)
    return { value: replaceStringVariables(fallback, translationOptions, translations) };
  const translation = translations[stringId] ?? fallback;
  return {
    value: replaceStringVariables(translation, translationOptions, translations),
    notExisting: !translations[stringId],
  };
};
