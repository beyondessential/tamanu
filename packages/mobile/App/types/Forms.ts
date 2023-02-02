import { FormikHelpers } from 'formik';
import * as Yup from 'yup';

export type GenericFormValues = {
  [key: string]: any;
}

export type FormOnSubmit<T> = (data: T, formikHelpers: FormikHelpers<T>) => Promise<void>;

export type FormValidate<T> = (data: T) => { [Key in keyof T | 'form']: string}

export type FormValidationSchema<T extends object> = Yup.ObjectSchema<Partial<T>>;
