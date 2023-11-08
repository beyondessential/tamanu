import React from 'react';
import { SEX_VALUE_INDEX } from '../../constants';
import { TranslatedText } from './TranslatedText';

export const SexDisplay = ({ sex }) => {
  switch (sex) {
    case SEX_VALUE_INDEX.male.value:
      return <TranslatedText stringId="patient.property.sex.male" fallback="Male" />;
    case SEX_VALUE_INDEX.female.value:
      return <TranslatedText stringId="patient.property.sex.female" fallback="Female" />;
    case SEX_VALUE_INDEX.other.value:
      return <TranslatedText stringId="patient.property.sex.other" fallback="Other" />;
    default:
      return <TranslatedText stringId="patient.property.sex.unknown" fallback="Unknown" />;
  }
};
