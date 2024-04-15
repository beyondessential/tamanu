import React from 'react';
import { useFormikContext } from 'formik';
import { useLocalisation } from '../../contexts/Localisation';
import { TextField } from './TextField';
import { LocalisedField } from './LocalisedField';
import { useTranslation } from '../../contexts/Translation';

const useDisplayIdValidation = label => {
  const { initialValues } = useFormikContext();
  const { getLocalisation } = useLocalisation();
  const pattern = getLocalisation('fields.displayId.pattern') || null;
  const regex = pattern ? new RegExp(pattern) : null;
  return value =>
    value !== initialValues[name] && regex && !regex.test(value) ? `Invalid ${label}` : undefined;
};

export const DisplayIdField = ({ required }) => {
  const { getTranslation } = useTranslation();
  const label = getTranslation('general.localisedField.displayId.label', 'National Health Number');
  const validateFn = useDisplayIdValidation(label);

  return (
    <LocalisedField
      name="displayId"
      label={label}
      component={TextField}
      required={required}
      validate={validateFn}
    />
  );
};
