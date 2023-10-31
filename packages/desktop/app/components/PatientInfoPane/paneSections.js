import React from 'react';
import { TranslatedText } from '../Translation/TranslatedText';

export const PANE_SECTION_IDS = {
  CONDITIONS: 'conditions',
  ALLERGIES: 'allergies',
  FAMILY_HISTORY: 'familyHistory',
  ISSUES: 'issues',
  CARE_PLANS: 'carePlans',
};

export const PANE_SECTION_TITLES = {
  [PANE_SECTION_IDS.CONDITIONS]: (
    <TranslatedText
      stringId="patientDetailsPane.subheading.conditions"
      fallback="Ongoing conditions"
    />
  ),
  [PANE_SECTION_IDS.ALLERGIES]: (
    <TranslatedText stringId="patientDetailsPane.subheading.allergies" fallback="Allergies" />
  ),
  [PANE_SECTION_IDS.FAMILY_HISTORY]: (
    <TranslatedText
      stringId="patientDetailsPane.subheading.familyHistory"
      fallback="Family history"
    />
  ),
  [PANE_SECTION_IDS.ISSUES]: (
    <TranslatedText
      stringId="patientDetailsPane.subheading.issues"
      fallback="Other patient issues"
    />
  ),
  [PANE_SECTION_IDS.CARE_PLANS]: (
    <TranslatedText stringId="patientDetailsPane.subheading.carePlans" fallback="Care plans" />
  ),
};
