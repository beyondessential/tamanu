import { useFormikContext } from 'formik';
import React from 'react';

import { useLocalisation } from '../../contexts/Localisation';
import { LocalisedField } from './LocalisedField';
import { TextField } from './TextField';

export const DisplayIdField = ({ name = 'displayId', required }) => {
  const { initialValues } = useFormikContext();
  const { getLocalisation } = useLocalisation();
  const longLabel = getLocalisation('fields.displayId.longLabel');
  const pattern = getLocalisation('fields.displayId.pattern') || null;
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
