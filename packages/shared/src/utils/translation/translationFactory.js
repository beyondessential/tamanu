const applyCasing = (text, uppercase, lowercase) => {
  if (lowercase) return text.toLowerCase();
  if (uppercase) return text.toUpperCase();
  return text;
};

/**
 * @param {string} templateString
 * @param {object}
 * @key replacements - object with replacement values
 * @key uppercase - boolean
 * @key lowercase - boolean
 * @param {object} translations
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
      let replacement = replacements[part.slice(1)] || part;
      if (typeof replacement !== 'object') return replacement;

      const translation = translations?.[replacement.props.stringId] || replacement.props.fallback;
      return applyCasing(translation, replacement.props.lowercase, replacement.props.uppercase);
    })
    .join('');

  return applyCasing(result, uppercase, lowercase);
};

export const translationFactory = translations => (
  stringId,
  fallback,
  replacements,
  uppercase,
  lowercase,
) => {
  const replacementConfig = {
    replacements,
    uppercase,
    lowercase,
  };
  if (!translations)
    return { value: replaceStringVariables(fallback, replacementConfig, translations) };
  const translation = translations[stringId] ?? fallback;
  return {
    value: replaceStringVariables(translation, replacementConfig, translations),
    notExisting: !translations[stringId],
  };
};
