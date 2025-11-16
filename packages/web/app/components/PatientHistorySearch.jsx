import React from 'react';
import { Box } from '@material-ui/core';
import { Field, Form, TranslatedSelectField, TranslatedText } from '@tamanu/ui-components';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { styled } from '@mui/material';

const StyledField = styled(Field)`
  width: 150px;
`;

export const PatientHistorySearch = () => {
  return (
    <Form
      onSubmit={async () => {}}
      render={() => (
        <Box display="flex" paddingY={1} gap={2}>
          <StyledField
            component={TranslatedSelectField}
            name="encounterType"
            label={<TranslatedText stringId="general.type.label" fallback="Type" />}
            enumValues={ENCOUNTER_TYPE_LABELS}
          />
        </Box>
      )}
    />
  );
};
