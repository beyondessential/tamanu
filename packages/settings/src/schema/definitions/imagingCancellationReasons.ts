import * as yup from 'yup';

export const imagingCancellationReasonsSchema = yup
  .array(
    yup.object({
      value: yup
        .string()
        .required()
        .max(31),
      label: yup.string().required(),
      hidden: yup.boolean(),
    }),
  )
  .test({
    name: 'imagingCancellationReasons',
    test(conf, ctx) {
      const values = conf.map(x => x.value);
      if (!values.includes('duplicate')) {
        return ctx.createError({
          message: 'imagingCancellationReasons must include an option with value = duplicate',
        });
      }
      if (!values.includes('entered-in-error')) {
        return ctx.createError({
          message:
            'imagingCancellationReasons must include an option with value = entered-in-error',
        });
      }
      return true;
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
