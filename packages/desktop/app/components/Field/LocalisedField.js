import React from 'react';

import { Field } from './Field';
import { useLocalisation } from '../../contexts/Localisation';

export const LocalisedField = ({ name, path: propPath, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const path = propPath || `fields.${name}`;
  const { hidden, longLabel } = getLocalisation(path);
  if (hidden) {
    return null;
  }
  return (
    <Field
      label={longLabel || path}
      name={name}
      {...props}
    />
  );
};
