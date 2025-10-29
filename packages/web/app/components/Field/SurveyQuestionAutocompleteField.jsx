import React from 'react';
import {
  useProgramRegistryContext,
  AutocompleteField,
  useSuggester,
  usePatientSuggester,
  getSuggesterEndpointForConfig,
} from '@tamanu/ui-components';

export const SurveyQuestionAutocompleteField = ({ config, ...props }) => {
  const endpoint = getSuggesterEndpointForConfig(config);
  const { programRegistryId } = useProgramRegistryContext(); // this will be null for normal surveys
  const isPatientSource = config?.source === 'Patient';
  const patientSuggester = usePatientSuggester();
  const otherSuggester = useSuggester(
    endpoint,
    programRegistryId ? { baseQueryParameters: { programRegistryId } } : {},
  );
  const suggester = isPatientSource ? patientSuggester : otherSuggester;
  return (
    <AutocompleteField suggester={suggester} {...props} data-testid="autocompletefield-efuf" />
  );
};
