import React from 'react';

import { StyledView } from '/styled/common';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';
import { getAgeFromDate } from '~/ui/helpers/date';
import { joinNames } from '~/ui/helpers/user';

const transformPatientData = (patient, config) => {
  const { dateOfBirth, firstName, lastName } = patient;
  switch (config.column) {
    case 'age':
      return getAgeFromDate(dateOfBirth);
    case 'fullName':
      return joinNames({ firstName, lastName });
    default:
      return patient[config.column];
  }
}

export const PatientDataField = ({ patient, name, config, defaultText }) => (
  <StyledView marginTop={10}>
    <Field
      component={TextField}
      name={name}
      label={defaultText}
      value={transformPatientData(patient, config)}
      disabled
    />
  </StyledView>
);
