import React from 'react';

import { Field } from '../components/Field';
import { useFlags } from '../contexts/FeatureFlags';

export const PatientField = ({ name, flag: propFlag, ...props }) => {
  const { getFlag } = useFlags();
  const flag = propFlag || `patientFieldOverrides.${name}`;
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

