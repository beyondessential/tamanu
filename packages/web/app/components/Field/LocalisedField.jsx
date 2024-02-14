import React, { useEffect } from 'react';

import * as yup from 'yup';
import { Field } from './Field';
import { useLocalisation } from '../../contexts/Localisation';
import { useFormikContext } from 'formik';
import { FORM_TYPES } from '../../constants';

/**
 * Default values should not be pre-filled on search forms,
 * edit forms or where an initial value has been explicitly defined for the field
 */
const shouldPrefillDefaultValue = (initialValue, formType, hidden, defaultValue) => {
  return !hidden && formType !== FORM_TYPES.SEARCH_FORM && !initialValue && defaultValue;
};

export const LocalisedField = ({
  name,
  useShortLabel,
  path = `fields.${name}`,
  defaultLabel,
  ...props
}) => {
  const { getLocalisation } = useLocalisation();

  const { hidden, defaultValue, longLabel, shortLabel, required } = getLocalisation(path) || {};

  const label = (useShortLabel ? shortLabel : longLabel) || defaultLabel || path;

  const { initialValues, status = {}, setFieldValue } = useFormikContext();
  const { formType } = status;
  const initialValue = initialValues[name];

  useEffect(() => {
    if (!shouldPrefillDefaultValue({ initialValue, formType, hidden, defaultValue })) return;
    setFieldValue(name, defaultValue);
  }, [initialValue, formType, name, setFieldValue, defaultValue, hidden]);

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
