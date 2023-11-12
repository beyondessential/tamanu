import React from 'react';

import * as yup from 'yup';
import { Field } from './Field';
import { useLocalisation } from '../../contexts/Localisation';

export const LocalisedField = ({ name, path = `fields.${name}`, label, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const hidden = getLocalisation(`${path}.hidden`);
  const required = getLocalisation(`${path}.required`) || false;
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
      const required = getLocalisation(`${path}.required`) || false;

      if (hidden) {
        return yup.string().nullable();
      }
      if (required) {
        return yup.string().required(`Required`);
      }
      return yup.string();
    },
  };
};
