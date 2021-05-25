import React from 'react';

import { Field } from './Field';
import { useFlags } from '../../contexts/FeatureFlags';

export const LocalisedField = ({ name, flag: propFlag, ...props }) => {
  const { getFlag } = useFlags();
  const flag = propFlag || `fields.${name}`;
  const { hidden, longLabel } = getFlag(flag);
  if (hidden) {
    return null;
  }
  return (
    <Field
      label={longLabel || flag}
      name={name}
      {...props}
    />
  );
};

