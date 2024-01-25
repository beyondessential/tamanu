import React from 'react';

import * as yup from 'yup';
import { Field } from './Field';
import { useSettings } from '../../contexts/Settings';

export const LocalisedField = ({
  name,
  useShortLabel,
  path = `localisation.fields.${name}`,
  defaultLabel,
  ...props
}) => {
  const { getSetting } = useSettings();
  const hidden = getSetting(`${path}.hidden`);
  const label =
    (useShortLabel ? getSetting(`${path}.shortLabel`) : getSetting(`${path}.longLabel`)) ||
    defaultLabel ||
    path;
  const required = getSetting(`${path}.required`) || false;
  if (hidden) {
    return null;
  }
  return <Field label={label} name={name} required={required} {...props} />;
};

export const useLocalisedSchema = () => {
  const { getSetting } = useSettings();
  return {
    getLocalisedSchema: ({ name, path = `fields.${name}` }) => {
      const hidden = getSetting(`${path}.hidden`);
      const label = getSetting(`${path}.longLabel`) || path;
      const required = getSetting(`${path}.required`) || false;

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
