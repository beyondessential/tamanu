import React from 'react';

import { Field } from './Field';
import { useLocalisation } from '../../contexts/Localisation';

export const LocalisedField = ({ name, path = `fields.${name}`, defaultLabel, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const hidden = getLocalisation(`${path}.hidden`);
  const label = getLocalisation(`${path}.longLabel`) || defaultLabel || path;
  if (hidden) {
    return null;
  }
  return <Field label={label} name={name} {...props} />;
};
