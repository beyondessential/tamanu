import React, { ReactElement } from 'react';
import { TranslatedText } from './TranslatedText';

export const getReferenceDataStringId = (value: string, category: string): string => {
  return `refData.${category}.${value}`;
};

interface TranslatedReferenceDataProps {
  category: string;
  value?: string;
  fallback?: string;
  placeholder?: React.ReactElement;
}

export const TranslatedReferenceData = ({
  category,
  value,
  fallback,
  placeholder,
}: TranslatedReferenceDataProps): ReactElement => {
  return value ? (
    <TranslatedText stringId={getReferenceDataStringId(value, category)} fallback={`${fallback}`} />
  ) : (
    placeholder
  );
};
