export const replaceInTemplate = (templateString, replacements) =>
  Object.entries(replacements ?? {}).reduce(
    (result, [key, replacement]) => result.replace(new RegExp(`\\$${key}\\$`, 'g'), replacement),
    templateString,
  );
