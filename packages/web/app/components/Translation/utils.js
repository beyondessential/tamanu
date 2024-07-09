import { isValidElement } from 'react';
import { LocationCell } from '../LocationCell.jsx';
import { TranslatedEnum, TranslatedReferenceData, TranslatedSex, TranslatedText } from '.';

/**
 * Given a valid React element, returns true if and only if that element is a wrapper around
 * {@link TranslatedText}. In other words, it is an element whose root might be a `<TranslatedText>`
 * element.
 */
export const isTranslatedText = element => {
  if (!isValidElement(element)) return false;
  return [
    TranslatedText,
    TranslatedReferenceData,
    TranslatedEnum,
    TranslatedSex,
    LocationCell,
  ].includes(element.type);
};
