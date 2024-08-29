import * as yup from 'yup';

const imagingCancellationReasonSchema = yup.object({
  value: yup
    .string()
    .required()
    .max(31),
  label: yup.string().required(),
  hidden: yup.boolean(),
});

export const imagingCancellationReasonsSchema = yup
  .array(imagingCancellationReasonSchema)
  .test({
    name: 'imagingCancellationReasons-dupe',
    message: 'labsCancellationReasons must include an option with value = duplicate',
    test: reasons => {
      if (reasons === undefined) return true; // Don’t fail validation if falling back to default value
      return reasons.some(r => r.value === 'duplicate');
    },
  })
  .test({
    name: 'imagingCancellationReasons-err',
    message: 'labsCancellationReasons must include an option with value = entered-in-error',
    test: reasons => {
      if (reasons === undefined) return true; // Don’t fail validation if falling back to default value
      return reasons.some(r => r.value === 'entered-in-error');
    },
  });

export const imagingCancellationReasonsDefault = [
  {
    value: 'clinical',
    label: 'Clinical reason',
    hidden: false,
  },
  {
    value: 'duplicate',
    label: 'Duplicate',
    hidden: false,
  },
  {
    value: 'entered-in-error',
    label: 'Entered in error',
    hidden: false,
  },
  {
    value: 'patient-discharged',
    label: 'Patient discharged',
    hidden: false,
  },
  {
    value: 'patient-refused',
    label: 'Patient refused',
    hidden: false,
  },
  {
    value: 'cancelled-externally',
    label: 'Cancelled externally via API',
    hidden: true,
  },
  {
    value: 'other',
    label: 'Other',
    hidden: false,
  },
];
