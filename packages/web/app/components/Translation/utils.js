import { isValidElement } from 'react';
import { TranslatedEnum, TranslatedReferenceData, TranslatedSex, TranslatedText } from '.';

export const isTranslatedText = element => {
  if (!isValidElement(element)) return false;
  return [TranslatedEnum, TranslatedReferenceData, TranslatedSex, TranslatedText].includes(
    element.type,
  );
};
