import React from 'react';
import { Box } from '@material-ui/core';
import { Field, Form, TranslatedSelectField } from '@tamanu/ui-components';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';

export const PatientHistorySearch = () => {
  return (
    <Form
      onSubmit={() => {}}
      render={() => (
        <Box display="flex" gap={2}>
          <Field
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
