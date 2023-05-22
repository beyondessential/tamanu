import React from 'react';
import { useFormikContext } from 'formik';

import { useLocalisation } from '../../contexts/Localisation';
import { TextField } from './TextField';
import { LocalisedField } from './LocalisedField';

export const DisplayIdField = ({ name = 'displayId', required }) => {
  const { initialValues } = useFormikContext();
  const { getLocalisation } = useLocalisation();
  const longLabel = getLocalisation('fields.displayId.longLabel');
  const pattern = getLocalisation('fields.displayId.pattern') || null;
  const regex = pattern ? new RegExp(pattern) : null;

  const validateFn = value => {
    let errorMessage;
    if (value !== initialValues[name] && regex.test(value) === false) {
      errorMessage = `Invalid ${longLabel}`;
    }
    return errorMessage;
  };

  return (
    <LocalisedField name={name} component={TextField} required={required} validate={validateFn} />
  );
};
