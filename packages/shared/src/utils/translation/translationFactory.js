import { upperFirst } from 'lodash';

const applyCasing = (text, casing) => {
  if (!casing) return text;
  if (casing === 'lower') return text.toLowerCase();
  if (casing === 'upper') return text.toUpperCase();
  if (casing === 'sentence') return upperFirst(text);
  return text;
};

/**
 * @param {string} templateString
 * @param {object} translationOptions
 * @key replacements - object with replacement values
 * @key casing - casing to apply to the final string
 * @param {object} translations
 * @returns {string}
 *
 * @example replaceStringVariables("there are :count users", { count: 2 }) => "there are 2 users"
 */
export const replaceStringVariables = (templateString, { replacements, casing }, translations) => {
  if (!replacements) return applyCasing(templateString, casing);
  const result = templateString
    .split(/(:[a-zA-Z]+)/g)
    .map((part, index) => {
      // Even indexes are the unchanged parts of the string
      if (index % 2 === 0) return part;
      // Return the replacement if exists
      let replacement = replacements[part.slice(1)] || part;
      if (typeof replacement !== 'object') return replacement;

      const translation = translations?.[replacement.props.stringId] || replacement.props.fallback;
      return applyCasing(translation, replacement.props.casing);
    })
    .join('');

  return applyCasing(result, casing);
};

export const translationFactory = translations => (stringId, fallback, replacements, casing) => {
  const replacementConfig = {
    replacements,
    casing,
  };
  if (!translations)
    return { value: replaceStringVariables(fallback, replacementConfig, translations) };
  const translation = translations[stringId] ?? fallback;
  return {
    value: replaceStringVariables(translation, replacementConfig, translations),
    notExisting: !translations[stringId],
  };
};
