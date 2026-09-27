import type { FormikHelpers } from 'formik';
import type * as Yup from 'yup';
import type { ObjectShape } from 'yup/lib/object';

export type GenericFormValues = {
  [key: string]: any;
};

export type FormOnSubmit<T> = (data: T, formikHelpers: FormikHelpers<T>) => Promise<void>;

export type FormValidate<T> = (data: T) => { [Key in keyof T | 'form']: string };

export type FormValidationSchema<T extends ObjectShape> = Yup.ObjectSchema<Partial<T>>;
