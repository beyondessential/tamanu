import React, { useEffect } from 'react';

import * as yup from 'yup';
import { Field } from './Field';
import { useLocalisation } from '../../contexts/Localisation';
import { useFormikContext } from 'formik';
import { FORM_TYPES } from '../../constants';

/**
 * Default values should only be pre-filled when the form is in create mode and an initial value has not been supplied
 * i.e edit form or a hardcoded initial value
 */
const shouldPrefillDefaultValue = (initialValue, formType) => {
  return formType !== FORM_TYPES.SEARCH_FORM && !initialValue
}

export const LocalisedField = ({
  name,
  useShortLabel,
  path = `fields.${name}`,
  defaultLabel,
  ...props
}) => {
  const { getLocalisation } = useLocalisation();

  const fieldConfig = getLocalisation(path);
  const { hidden,defaultValue, longLabel, shortLabel, required } = fieldConfig;

  const label = (useShortLabel
      ? shortLabel
      : longLabel) ||
    defaultLabel ||
    path;


  const {initialValues, status, setFieldValue} = useFormikContext();
  const initialValue = initialValues[name]

  useEffect(() => {
    if (hidden || !defaultValue) return
    if  (!shouldPrefillDefaultValue(initialValue, status?.formType)) return
    setFieldValue(name, defaultValue);
  },[initialValue, status, fieldConfig, name, setFieldValue, defaultValue, hidden])

  if (hidden) {
    return null;
  }

  return <Field label={label} name={name} required={required} {...props} />;
};

export const useLocalisedSchema = () => {
  const { getLocalisation } = useLocalisation();
  return {
    getLocalisedSchema: ({ name, path = `fields.${name}` }) => {
      const hidden = getLocalisation(`${path}.hidden`);
      const label = getLocalisation(`${path}.longLabel`) || path;
      const required = getLocalisation(`${path}.required`) || false;

      if (hidden) {
        return yup.string().nullable();
      }
      if (required) {
        return yup.string().required(`${label} is a required field`);
      }
      return yup.string();
    },
  };
};
