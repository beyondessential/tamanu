import React from 'react';
import { TranslatedText } from '../Translation/TranslatedText';

export const PANE_SECTION_IDS = {
  CONDITIONS: 'conditions',
  ALLERGIES: 'allergies',
  FAMILY_HISTORY: 'familyHistory',
  ISSUES: 'issues',
  CARE_PLANS: 'carePlans',
  PROGRAM_REGISTRY: 'programRegistry',
};

export const PANE_SECTION_TITLES = {
  [PANE_SECTION_IDS.CONDITIONS]: (
    <TranslatedText
      stringId="patient.detailsSidebar.subheading.conditions"
      fallback="Ongoing conditions"
      data-testid="translatedtext-nvfn"
    />
  ),
  [PANE_SECTION_IDS.ALLERGIES]: (
    <TranslatedText
      stringId="patient.detailsSidebar.subheading.allergies"
      fallback="Allergies"
      data-testid="translatedtext-20b6"
    />
  ),
  [PANE_SECTION_IDS.FAMILY_HISTORY]: (
    <TranslatedText
      stringId="patient.detailsSidebar.subheading.familyHistory"
      fallback="Family history"
      data-testid="translatedtext-xiy5"
    />
  ),
  [PANE_SECTION_IDS.ISSUES]: (
    <TranslatedText
      stringId="patient.detailsSidebar.subheading.otherPatientIssues"
      fallback="Other patient issues"
      data-testid="translatedtext-jl36"
    />
  ),
  [PANE_SECTION_IDS.CARE_PLANS]: (
    <TranslatedText
      stringId="patient.detailsSidebar.subheading.carePlans"
      fallback="Care plans"
      data-testid="translatedtext-jhl1"
    />
  ),
  [PANE_SECTION_IDS.PROGRAM_REGISTRY]: (
    <TranslatedText
      stringId="patient.detailsSidebar.subheading.programRegistries"
      fallback="Program registry"
      data-testid="translatedtext-3xcs"
    />
  ),
};
