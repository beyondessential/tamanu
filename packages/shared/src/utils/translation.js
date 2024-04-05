import { replaceStringVariables } from "./translation/translationFactory";

export const defaultTranslationFn = (_, fallback, replacements) => {
  return replaceStringVariables(fallback, replacements);
};
