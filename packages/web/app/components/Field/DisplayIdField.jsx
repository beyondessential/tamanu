import React from 'react';
import { useFormikContext } from 'formik';

import { useLocalisation } from '../../contexts/Localisation';
import { TextField } from './TextField';
import { LocalisedField } from './LocalisedField';
import { TranslatedText } from '../Translation/TranslatedText';

export const DisplayIdField = ({ required }) => {
  const { initialValues } = useFormikContext();
  const { getLocalisation } = useLocalisation();
  const pattern = getLocalisation('fields.displayId.pattern') || null;
  const regex = pattern ? new RegExp(pattern) : null;

  const validateFn = value => {
    let errorMessage;
    if (value !== initialValues[name] && regex && !regex.test(value)) {
      // #TODO translation
      errorMessage = `Invalid`;
    }
    return errorMessage;
  };

  return (
    <LocalisedField
      name="displayId"
      label={
        <TranslatedText
          stringId="general.localisedField.displayId.label"
          label="National Health Number"
        />
      }
      component={TextField}
      required={required}
      validate={validateFn}
    />
  );
};
