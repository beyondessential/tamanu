import React from 'react';

import { connectApi } from '../../api/connectApi';
import { Suggester } from '../../utils/suggester';
import { AutocompleteField } from './AutocompleteField';

// Required due to desktop/mobile using different implementations for
// suggesters (due to using different db's). Mobile has the more generic
// approach already, so do the extra step here.
const getSuggesterEndpointForConfig = config => {
  if (config?.source === 'ReferenceData') return config?.where?.type;
  if (config?.source === 'Facility') return 'facility';
  if (config?.source === 'Location') return 'location';
  if (config?.source === 'Department') return 'department';
  if (config?.source === 'User') return 'practitioner';

  // autocomplete component won't crash when given an invalid endpoint, it just logs an error.
  return null;
};

const SurveyQuestionAutocompleteComponent = props => <AutocompleteField {...props} />;

export const SurveyQuestionAutocomplete = connectApi((api, dispatch, { config }) => ({
  suggester: new Suggester(api, getSuggesterEndpointForConfig(config)),
}))(SurveyQuestionAutocompleteComponent);
