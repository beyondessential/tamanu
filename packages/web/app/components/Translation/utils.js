import { isValidElement } from 'react';
import { LocationCell } from '../LocationCell.jsx';
import { TranslatedEnum, TranslatedReferenceData, TranslatedSex, TranslatedText } from '.';

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
