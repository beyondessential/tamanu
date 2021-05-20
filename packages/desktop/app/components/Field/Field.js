import React from 'react';
import { Field as FormikField, connect as formikConnect } from 'formik';

import { useFlags } from '../../contexts/FeatureFlags';

export const Field = formikConnect(({ formik: { errors }, name, helperText, flag, ...props }) => {
  const { getFlag } = useFlags();
  if (getFlag(`${flag}.hidden`) === true) {
    return null;
  }
  return (
    <FormikField
      label={flag ? getFlag(`${flag}.longLabel`) || flag : null}
      {...props}
      error={!!errors[name]}
      helperText={errors[name] || helperText}
      name={name}
    />
  );
});

