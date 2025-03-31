import React from 'react';
import { SEX_VALUE_INDEX } from '@tamanu/constants';
import { TranslatedText } from './TranslatedText';

export const TranslatedSex = ({ sex }) => {
  switch (sex) {
    case SEX_VALUE_INDEX.male.value:
      return (
        <TranslatedText
          stringId="patient.property.sex.male"
          fallback="Male"
          data-testid='translatedtext-bg8v' />
      );
    case SEX_VALUE_INDEX.female.value:
      return (
        <TranslatedText
          stringId="patient.property.sex.female"
          fallback="Female"
          data-testid='translatedtext-of45' />
      );
    case SEX_VALUE_INDEX.other.value:
      return (
        <TranslatedText
          stringId="patient.property.sex.other"
          fallback="Other"
          data-testid='translatedtext-y0s6' />
      );
    default:
      return (
        <TranslatedText
          stringId="patient.property.sex.unknown"
          fallback="Unknown"
          data-testid='translatedtext-ki1c' />
      );
  }
};
