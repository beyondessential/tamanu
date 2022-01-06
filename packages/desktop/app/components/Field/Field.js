import React from 'react';
import { Field as FormikField, connect as formikConnect, getIn } from 'formik';

export const Field = formikConnect(({ formik: { errors }, name, helperText, ...props }) => (
  <FormikField
    {...props}
    error={!!getIn(errors, name)}
    helperText={getIn(errors, name) || helperText}
    name={name}
  />
));
