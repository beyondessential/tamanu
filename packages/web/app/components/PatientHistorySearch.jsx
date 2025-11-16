import React from 'react';
import { Box } from '@material-ui/core';
import { Field, Form, TranslatedSelectField } from '@tamanu/ui-components';
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
        <Box paddingY={1} display="flex" gap={2}>
            <StyledField
            component={TranslatedSelectField}
            name="encounterType"
            label="Encounter Type"
            enumValues={ENCOUNTER_TYPE_LABELS}
          />
        </Box>
      )}
    />
  );
};
