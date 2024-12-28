export const replaceInTemplate = (
  templateString: string,
  replacements: Record<string, string | number> | null | undefined,
) =>
  Object.entries(replacements ?? {}).reduce(
    (result, [key, replacement]) =>
      result.replace(new RegExp(`\\$${key}\\$`, 'g'), replacement.toString()),
    templateString,
  );
