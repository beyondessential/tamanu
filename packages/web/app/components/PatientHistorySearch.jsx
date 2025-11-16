import React from 'react';
import { Box } from '@material-ui/core';
import { MultiselectField } from './Field/MultiselectField';
import { Field, useSuggester } from '@tamanu/ui-components';

export const PatientHistorySearch = () => {
  const encounterTypeSuggester = useSuggester('encounterType');
  return (
    <Box display="flex" gap={2}>
      <Field
        component={MultiselectField}
        name="encounterType"
        label="Encounter Type"
        suggester={encounterTypeSuggester}
      />
    </Box>
  );
};
