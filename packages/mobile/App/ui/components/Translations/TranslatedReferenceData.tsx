import React from 'react';
import { TranslatedText } from './TranslatedText';

const REFERENCE_DATA_PREFIX = 'refData';

export const getReferenceDataStringId = (value: string, category: string) => {
  return `${REFERENCE_DATA_PREFIX}.${category}.${value}`;
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
}: TranslatedReferenceDataProps) => {
  return value ? (
    <TranslatedText stringId={getReferenceDataStringId(value, category)} fallback={fallback} />
  ) : (
    placeholder
  );
};
