import React, { useEffect } from 'react';

import * as yup from 'yup';
import { Field } from './Field';

import { useSettings } from '../../contexts/Settings';
import { useFormikContext } from 'formik';
import { FORM_TYPES } from '../../constants';

/**
 * Field localisation default values should only be applied on create forms
 * and where an initial value has not been explicitly defined for the field
 */
const shouldPrefillDefaultValue = ({ initialValue, formType, hidden, defaultValue }) => {
  return !hidden && formType === FORM_TYPES.CREATE_FORM && !initialValue && defaultValue;
};

export const LocalisedField = ({ name, path = `fields.${name}`, label, ...props }) => {
  const { getSetting, getSettingExists } = useSettings();

  const { hidden, defaultValue, required = false } = getSettingExists(path) ? getSetting(path) : {};
  const { initialValues, status = {}, setFieldValue } = useFormikContext();

  const { formType } = status;
  const initialValue = initialValues[name];

  useEffect(() => {
    if (!shouldPrefillDefaultValue({ initialValue, formType, hidden, defaultValue })) return;
    if (Array.isArray(defaultValue)) {
      setFieldValue(name, JSON.stringify(defaultValue));
    } else {
      setFieldValue(name, defaultValue);
    }
    // only check to prefill default value when initialValue or formType changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, formType]);

  if (hidden) {
    return null;
  }

  return <Field label={label} name={name} required={required} {...props} />;
};

export const useLocalisedSchema = () => {
  const { getSetting, getSettingExists } = useSettings();
  return {
    getLocalisedSchema: ({ name, path = `fields.${name}` }) => {
      const { hidden, required = false } = getSettingExists(path) ? getSetting(path) : {};
      if (hidden) return yup.string().nullable();
      if (required) return yup.string().required('Required');
      return yup.string();
    },
  };
};
