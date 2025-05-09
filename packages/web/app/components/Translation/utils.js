import { isValidElement } from 'react';
import { SexCell } from '../../views/patients/columns';
import { LocationCell } from '../LocationCell';
import { TranslatedEnum, TranslatedReferenceData, TranslatedSex, TranslatedText } from '.';
import { ClinicalStatusCell } from '../../views/programRegistry/ClinicalStatusDisplay';

/**
 * Given a valid React element, returns true if and only if that element is a wrapper around
 * {@link TranslatedText}. In other words, it is an element whose root might be a `<TranslatedText>`
 * element.
 */
export const isTranslatedText = (element) => {
  if (!isValidElement(element)) return false;

  return [
    TranslatedText,
    TranslatedReferenceData,
    TranslatedEnum,
    TranslatedSex,
    // Workaround so that custom table cells that have translations work with table exports
    LocationCell,
    SexCell,
    ClinicalStatusCell,
  ].includes(element.type);
};
