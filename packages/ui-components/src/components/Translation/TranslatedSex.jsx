import React from 'react';
import { SEX_VALUE_INDEX } from '@tamanu/constants';
import { TranslatedText } from './TranslatedText';

const SEX_TRANSLATIONS = {
  [SEX_VALUE_INDEX.male.value]: {
    stringId: 'patient.property.sex.male',
    shortStringId: 'patient.property.sex.male.short',
    fallback: 'Male',
    shortFallback: 'M',
  },
  [SEX_VALUE_INDEX.female.value]: {
    stringId: 'patient.property.sex.female',
    shortStringId: 'patient.property.sex.female.short',
    fallback: 'Female',
    shortFallback: 'F',
  },
  [SEX_VALUE_INDEX.other.value]: {
    stringId: 'patient.property.sex.other',
    shortStringId: 'patient.property.sex.other.short',
    fallback: 'Other',
    shortFallback: 'O',
  },
};

const UNKNOWN_SEX_TRANSLATION = {
  stringId: 'patient.property.sex.unknown',
  shortStringId: 'patient.property.sex.unknown.short',
  fallback: 'Unknown',
  shortFallback: '—',
};

export const TranslatedSex = ({ sex, short = false, ...props }) => {
  const translation = SEX_TRANSLATIONS[sex] ?? UNKNOWN_SEX_TRANSLATION;

  return (
    <TranslatedText
      stringId={short ? translation.shortStringId : translation.stringId}
      fallback={short ? translation.shortFallback : translation.fallback}
      {...props}
    />
  );
};
