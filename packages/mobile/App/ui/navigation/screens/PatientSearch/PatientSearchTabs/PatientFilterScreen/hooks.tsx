import { useMemo } from 'react';
import { useField } from 'formik';

export const useFilterFields = () => {
  const sex = useField('sex');
  const dateOfBirth = useField('dateOfBirth');
  const firstName = useField('firstName');
  const lastName = useField('lastName');

  const fields = useMemo(
    () => [sex, dateOfBirth, firstName, lastName],
    [sex[1].value, dateOfBirth[1].value, firstName[1].value, lastName[1].value],
  );

  return fields;
};
