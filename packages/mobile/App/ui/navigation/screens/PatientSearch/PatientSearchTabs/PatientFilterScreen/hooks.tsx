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

export const useClearFilterFields = () => {
  const [sex, dateOfBirth, firstName, lastName, villageId, programRegistryId] = useFilterFields();
  return () => {
    sex[2].setValue('');
    dateOfBirth[2].setValue(null);
    firstName[2].setValue('');
    lastName[2].setValue('');
    villageId[2].setValue(null);
    programRegistryId[2].setValue(null);
  };
};
