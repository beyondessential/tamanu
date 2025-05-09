import React from 'react';
import { useFormikContext } from 'formik';
import { TextField } from './TextField';
import { LocalisedField } from './LocalisedField';
import { useTranslation } from '../../contexts/Translation';
import { useSettings } from '../../contexts/Settings';

const useDisplayIdValidation = (label, fieldName = 'displayId') => {
  const { initialValues } = useFormikContext();
  const { getSetting } = useSettings();
  const pattern = getSetting('fields.displayId.pattern');
  const regex = pattern ? new RegExp(pattern) : null;
  return (value) =>
    value !== initialValues[fieldName] && regex && !regex.test(value)
      ? `Invalid ${label}`
      : undefined;
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
      enablePasting
      data-testid="localisedfield-a0ac"
    />
  );
};
