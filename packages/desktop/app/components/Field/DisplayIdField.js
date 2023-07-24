import React from 'react';
import { useFormikContext } from 'formik';

import { useConfig } from '../../contexts/Localisation';
import { TextField } from './TextField';
import { LocalisedField } from './LocalisedField';

export const DisplayIdField = ({ name = 'displayId', required }) => {
  const { initialValues } = useFormikContext();
  const [longLabel, pattern = null] = useConfig([
    'fields.displayId.longLabel',
    'fields.displayId.pattern',
  ]);
  const regex = pattern ? new RegExp(pattern) : null;

  const validateFn = value => {
    let errorMessage;
    if (value !== initialValues[name] && regex && !regex.test(value)) {
      errorMessage = `Invalid ${longLabel}`;
    }
    return errorMessage;
  };

  return (
    <LocalisedField name={name} component={TextField} required={required} validate={validateFn} />
  );
};
