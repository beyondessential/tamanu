import * as yup from 'yup';

const reasonSchema = yup.object({
  value: yup
    .string()
    .lowercase()
    .strict()
    .required()
    .max(31),
  label: yup.string().required(),
});

export const labsCancellationReasonsSchema = yup
  .array(reasonSchema)
  .test({
    name: 'labsCancellationReasons-dupe',
    message: 'labsCancellationReasons must include an option with value = duplicate',
    test: reasons => {
      if (reasons === undefined) return true; // Don’t fail validation if falling back to default value
      return reasons.some(r => r.value === 'duplicate');
    },
  })
  .test({
    name: 'labsCancellationReasons-err',
    message: 'labsCancellationReasons must include an option with value = entered-in-error',
    test: reasons => {
      if (reasons === undefined) return true; // Don’t fail validation if falling back to default value
      return reasons.some(r => r.value === 'entered-in-error');
    },
  });

export const labsCancellationReasonsDefault = [
  {
    value: 'clinical',
    label: 'Clinical reason',
  },
  {
    value: 'duplicate',
    label: 'Duplicate',
  },
  {
    value: 'entered-in-error',
    label: 'Entered in error',
  },
  {
    value: 'patient-discharged',
    label: 'Patient discharged',
  },
  {
    value: 'patient-refused',
    label: 'Patient refused',
  },
  {
    value: 'other',
    label: 'Other',
  },
];
