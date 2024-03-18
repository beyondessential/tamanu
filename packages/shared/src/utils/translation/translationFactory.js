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

export const translationFactory = translations => (stringId, fallback, replacements) => {
  if (!translations) return { value: replaceStringVariables(fallback, replacements) };
  if (translations[stringId])
    return { value: replaceStringVariables(translations[stringId], replacements) };
  return { value: replaceStringVariables(fallback, replacements), notExisting: true };
};
