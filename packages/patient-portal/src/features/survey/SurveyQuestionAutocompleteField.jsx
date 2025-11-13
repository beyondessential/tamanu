import React from 'react';
import { Box } from '@mui/material';
import {
  useProgramRegistryContext,
  AutocompleteField,
  useSuggester,
  getSuggesterEndpointForConfig,
} from '@tamanu/ui-components';
import { PORTAL_SUGGESTER_ALLOW_LIST } from '@tamanu/constants';

export const SurveyQuestionAutocompleteField = ({ config, ...props }) => {
  const endpoint = getSuggesterEndpointForConfig(config);
  const { programRegistryId } = useProgramRegistryContext(); // this will be null for normal surveys
  const suggester = useSuggester(
    endpoint,
    programRegistryId ? { baseQueryParameters: { programRegistryId } } : {},
  );

  if (PORTAL_SUGGESTER_ALLOW_LIST.includes(endpoint)) {
    return (
      <AutocompleteField suggester={suggester} {...props} data-testid="autocompletefield-efuf" />
    );
  }

  return (
    <Box>
      {props.label}
      <Box sx={{ p: 2, border: '1px dashed grey' }}>The {endpoint} resource is not supported</Box>
    </Box>
  );
};
