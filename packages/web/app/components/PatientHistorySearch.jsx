import React from 'react';
import { Box } from '@material-ui/core';
import {
  AutocompleteField,
  Field,
  Form,
  TranslatedSelectField,
  TranslatedText,
  useSuggester,
} from '@tamanu/ui-components';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { styled } from '@mui/material';

const StyledField = styled(Field)`
  width: 150px;
`;

const Container = styled(Box)`
  display: flex;
  padding-top: 5px;
  padding-bottom: 5px;
  gap: 5px;
`;

export const PatientHistorySearch = () => {
  const facilitySuggester = useSuggester('facility', { baseQueryParameters: { noLimit: true } });
  return (
    <Form
      onSubmit={async () => {}}
      render={() => (
        <Container>
          <StyledField
            component={TranslatedSelectField}
            name="encounterType"
            label={<TranslatedText stringId="general.type.label" fallback="Type" />}
            enumValues={ENCOUNTER_TYPE_LABELS}
          />
          <StyledField
            component={AutocompleteField}
            name="facility"
            label={<TranslatedText stringId="general.facility.label" fallback="Facility" />}
            suggester={facilitySuggester}
          />
        </Container>
      )}
    />
  );
};
