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

export const defaultTranslationFn = (_, fallback, replacements) => {
  return replaceStringVariables(fallback, replacements);
};
