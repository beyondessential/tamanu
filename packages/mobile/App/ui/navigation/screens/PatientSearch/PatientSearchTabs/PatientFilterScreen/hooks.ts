import { useMemo } from 'react';
import { useField } from 'formik';

export const useFilterFields = () => {
  const sex = useField('sex');
  const dateOfBirth = useField('dateOfBirth');
  const firstName = useField('firstName');
  const lastName = useField('lastName');
  // uses new IdRelation decorator on model, so the field is `villageId` and not `village`
  const villageId = useField('villageId');
  const programRegistryId = useField('programRegistryId');

  /* eslint-disable react-hooks/exhaustive-deps */
  // the rule false-positives due to complexity that we do want
  const fields = useMemo(
    () => [sex, dateOfBirth, firstName, lastName, villageId, programRegistryId],
    [
      sex[1].value,
      dateOfBirth[1].value,
      firstName[1].value,
      lastName[1].value,
      villageId[1].value,
      programRegistryId[1].value,
    ],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  return fields;
};
