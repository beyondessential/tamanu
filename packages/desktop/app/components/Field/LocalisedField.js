import React from 'react';

import * as yup from 'yup';
import { Field } from './Field';
import { useLocalisation } from '../../contexts/Localisation';

export const LocalisedField = ({ name, path = `fields.${name}`, defaultLabel, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const hidden = getLocalisation(`${path}.hidden`);
  const label = getLocalisation(`${path}.longLabel`) || defaultLabel || path;
  const required = getLocalisation(`${path}.required`) || false;
  if (hidden) {
    return null;
  }
  return <Field label={label} name={name} required={required} {...props} />;
};

export const getLocalisedSchema = (getLocalisation, { name, path = `fields.${name}` }) => {
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
};
