import React from 'react';
import {
  AutocompleteField,
  createPatientFormQuestionTypes,
  getSuggesterEndpointForConfig,
  toPatientForm,
  useSuggester,
} from '@tamanu/ui-components';

const KIOSK_SUGGESTER_OPTIONS = { basePath: 'kiosk/suggestions' };

/** Searches through the kiosk's own route, which an account that can only run the kiosk may use. */
const KioskAutocompleteQuestion = ({ config, ...props }) => {
  const suggester = useSuggester(getSuggesterEndpointForConfig(config), KIOSK_SUGGESTER_OPTIONS);
  return <AutocompleteField suggester={suggester} {...props} data-testid="kiosk-autocomplete" />;
};

export const {
  isSupportedQuestionType: isKioskQuestionType,
  getComponentForQuestionType: getKioskComponentForQuestionType,
} = createPatientFormQuestionTypes({ AutocompleteQuestion: KioskAutocompleteQuestion });

export const toKioskForm = survey => toPatientForm(survey, isKioskQuestionType);
