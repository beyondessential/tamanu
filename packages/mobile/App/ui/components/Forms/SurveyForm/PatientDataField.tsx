import React from 'react';

import { StyledView } from '/styled/common';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';

export const PatientDataField = ({ patient, name, config, defaultText }) => (
  <StyledView marginTop={10}>
    <Field
      component={TextField}
      name={name}
      label={defaultText}
      value={patient[config.column]}
      disabled
    />
  </StyledView>
);
