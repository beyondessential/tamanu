import { isValidElement } from 'react';
import { TranslatedEnum, TranslatedSex, TranslatedReferenceData, TranslatedText } from '.';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { getEnumPrefix, toCamelCase } from '@tamanu/shared/utils/enumRegistry';

/**
 * Given a valid React element, returns true if and only if that element is a wrapper around
 * {@link TranslatedText}. In other words, it is an element whose root might be a `<TranslatedText>`
 * element.
 */
export const isTranslatedText = element => {
  if (!isValidElement(element)) return false;

  return [TranslatedText, TranslatedReferenceData, TranslatedEnum, TranslatedSex].includes(
    element.type,
  );
};

/**
 * Extracts the translated text from a translation component
 * @param {React.ReactElement|string} element - The element to extract translation from
 * @param {Function} getTranslation - The translation function from useTranslation hook
 * @returns {string} - The translated text
 */
export const extractTranslationFromComponent = (element, getTranslation) => {
  if (typeof element === 'string') return element;
  if (!isTranslatedText(element)) return '';

  const { type, props } = element;
  switch (type) {
    case TranslatedText:
      return getTranslation(props.stringId, props.fallback);
    case TranslatedReferenceData:
      return getTranslation(getReferenceDataStringId(props.value, props.category), props.fallback);
    case TranslatedEnum:
      return getTranslation(
        `${getEnumPrefix(props.enumValues)}.${toCamelCase(props.value)}`,
        props.enumValues[props.value],
      );
    default:
      return '';
  }
};
