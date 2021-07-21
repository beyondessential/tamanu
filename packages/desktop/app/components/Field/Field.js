import React from 'react';
import { Field as FormikField, connect as formikConnect } from 'formik';

export const Field = formikConnect(({ formik: { errors }, name, helperText, ...props }) => (
  <FormikField
    {...props}
    error={!!errors[name]}
    helperText={errors[name] || helperText}
    name={name}
  />
));
