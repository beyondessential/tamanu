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

  const sexValue = sex[1].value;
  const dateOfBirthValue = dateOfBirth[1].value;
  const firstNameValue = firstName[1].value;
  const lastNameValue = lastName[1].value;
  const villageIdValue = villageId[1].value;
  const programRegistryIdValue = programRegistryId[1].value;

  const fields = useMemo(
    () => [sex, dateOfBirth, firstName, lastName, villageId, programRegistryId],
    [
      sex,
      dateOfBirth,
      firstName,
      lastName,
      villageId,
      programRegistryId,
      sexValue,
      dateOfBirthValue,
      firstNameValue,
      lastNameValue,
      villageIdValue,
      programRegistryIdValue,
    ],
  );

  return fields;
};
