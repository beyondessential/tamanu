import React from 'react';

import { SuggesterSelectField, Field } from '..';

export const LabTestPanelField = ({ name = 'labTestPanelId', required, disabled }) => (
  <Field
    name={name}
    label="Test panel"
    component={SuggesterSelectField}
    endpoint="labTestPanel"
    required={required}
    disabled={disabled}
  />
);
