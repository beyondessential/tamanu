import React from 'react';

import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const getEncounterStartDateLabel = encounterType => {
  switch (encounterType) {
    case ENCOUNTER_TYPES.ADMISSION:
      return (
        <TranslatedText
          stringId="encounter.admissionDate.label"
          fallback="Admission date"
          data-testid="translatedtext-dn4a"
        />
      );
    case ENCOUNTER_TYPES.OBSERVATION:
    case ENCOUNTER_TYPES.EMERGENCY:
    case ENCOUNTER_TYPES.TRIAGE:
      return (
        <TranslatedText
          stringId="encounter.triageDate.label"
          fallback="Triage date"
          data-testid="translatedtext-qx7p"
        />
      );
    default:
      return (
        <TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid="translatedtext-f73z"
        />
      );
  }
};
