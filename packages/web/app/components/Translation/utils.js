import React from 'react';
import { TranslatedEnum, TranslatedReferenceData, TranslatedSex, TranslatedText } from '.';

export const isTranslatedText = element => {
  if (!React.isValidElement(element)) return false;
  return [TranslatedEnum, TranslatedReferenceData, TranslatedSex, TranslatedText].includes(
    element.type,
  );
};
