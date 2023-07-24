import React from 'react';

import * as yup from 'yup';
import { Field } from './Field';
import { useConfig, useLocalisation } from '../../contexts/Localisation';

export const LocalisedField = ({
  name,
  useShortLabel,
  path = `fields.${name}`,
  defaultLabel,
  ...props
}) => {
  const [hidden, label = defaultLabel || path, required = false] = useConfig([
    `${path}.hidden`,
    useShortLabel ? `${path}.shortLabel` : `${path}.longLabel`,
    `${path}.required`,
  ]);
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
