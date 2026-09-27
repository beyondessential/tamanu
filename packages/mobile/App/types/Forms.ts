import type { FormikHelpers } from 'formik';
import type * as Yup from 'yup';

export type GenericFormValues = {
  [key: string]: any;
};

export type FormOnSubmit<T> = (data: T, formikHelpers: FormikHelpers<T>) => Promise<void>;

export type FormValidationSchema = Yup.AnyObjectSchema;
