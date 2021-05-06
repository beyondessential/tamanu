import { FormikHelpers } from 'formik';

export function formikSubmitFormAdapter<T>(callback: (data: T) => Promise<void>) {
  return async (data: T, actions: FormikHelpers<T>): Promise<void> => {
    await callback(data);
    actions.setSubmitting(false);
  };
}

export function arrayToDropdownOptions(array): Array<string> {
  return array.map(option => ({
    label: option,
    value: option,
  }));
}
