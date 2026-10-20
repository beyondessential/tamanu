import { Formik, type FormikConfig } from 'formik';
import React from 'react';
import type { FormOnSubmit, FormValidationSchema, GenericFormValues } from '~/types/Forms';

interface FormProps<T extends GenericFormValues> extends Pick<
  FormikConfig<T>,
  'children' | 'initialValues' | 'validate' | 'validateOnBlur' | 'validateOnChange'
> {
  onSubmit: FormOnSubmit<T>;
  validationSchema?: FormValidationSchema;
}

export default function Form<T>({
  validateOnBlur = false,
  validateOnChange = false,
  ...props
}: FormProps<T>) {
  return <Formik validateOnBlur={validateOnBlur} validateOnChange={validateOnChange} {...props} />;
}
