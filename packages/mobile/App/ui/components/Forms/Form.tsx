import React, { ReactElement } from 'react';
import { Formik, FormikProps } from 'formik';
import { FormValidate, FormOnSubmit, FormValidationSchema, GenericFormValues } from '~/types/Forms';

type FormProps<T extends GenericFormValues> = {
  initialValues: T;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validationSchema: FormValidationSchema<T>;
  onSubmit: FormOnSubmit<T>;
  children: (props: FormikProps<T>) => ReactElement;
  validate?: FormValidate<T>;
};

export function Form<T>({
  initialValues,
  validationSchema,
  validateOnChange = false,
  validateOnBlur = false,
  onSubmit,
  children,
  validate,
}: FormProps<T>): JSX.Element {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      validate={validate}
      validateOnChange={validateOnChange}
      validateOnBlur={validateOnBlur}
      onSubmit={onSubmit}
    >
      {children}
    </Formik>
  );
}
