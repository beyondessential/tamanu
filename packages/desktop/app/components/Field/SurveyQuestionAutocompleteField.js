import React from 'react';
import { useSuggester } from '../../api';
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
  if (config?.source === 'LocationGroup') {
    return config.scope === 'allFacilities' ? 'locationGroup' : 'facilityLocationGroup';
  }
  if (config?.source === 'Village') return 'village';
  if (config?.source === 'ProgramRegistryClinicalStatus') return 'programRegistryClinicalStatus';

  // autocomplete component won't crash when given an invalid endpoint, it just logs an error.
  return null;
};

export const SurveyQuestionAutocompleteField = ({ config, ...props }) => {
  const endpoint = getSuggesterEndpointForConfig(config);
  const suggester = useSuggester(endpoint);
  return <AutocompleteField suggester={suggester} {...props} />;
};
