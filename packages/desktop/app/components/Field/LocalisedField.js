import React from 'react';

import { Field } from './Field';
import { useLocalisation } from '../../contexts/Localisation';

export const LocalisedField = ({ label, name, path: propPath, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const path = propPath || `fields.${name}`;
  const fieldLocalisation = getLocalisation(path);
  if (!fieldLocalisation) {
    // eslint-disable-next-line no-console
    console.warn(`LocalisedField: No localisation for path: ${path}`);
  }
  const { hidden, longLabel } = fieldLocalisation || {};
  if (hidden) {
    return null;
  }
  return <Field label={label || longLabel || path} name={name} {...props} />;
};
