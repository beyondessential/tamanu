import { useField } from 'formik';

export const useFilterFields = () => {
  const sex = useField<string>('sex');
  const dateOfBirth = useField<Date | null>('dateOfBirth');
  const firstName = useField<string>('firstName');
  const lastName = useField<string>('lastName');
  // uses new IdRelation decorator on model, so the field is `villageId` and not `village`
  const villageId = useField<string | null>('villageId');
  const programRegistryId = useField<string | null>('programRegistryId');

  return [sex, dateOfBirth, firstName, lastName, villageId, programRegistryId] as const;
};
