import { replaceStringVariables } from '@tamanu/shared/utils/translation/translationFactory';

export const defaultTranslationFn = (_, fallback, replacements) => {
  return replaceStringVariables(fallback, { replacements });
};
