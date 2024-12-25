export const replaceInTemplate = (templateString: string, replacements?: Record<string, string>) =>
  Object.entries(replacements ?? {}).reduce(
    (result, [key, replacement]) => result.replace(new RegExp(`\\$${key}\\$`, 'g'), replacement),
    templateString,
  );
