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

export const labsCancellationReasonsSchema = yup.array(reasonSchema).test({
  name: 'labsCancellationReasons',
  test(conf, ctx) {
    const values = conf.map(x => x.value);
    if (!values.includes('duplicate')) {
      return ctx.createError({
        message: 'labsCancellationReasons must include an option with value = duplicate',
      });
    }
    if (!values.includes('entered-in-error')) {
      return ctx.createError({
        message: 'labsCancellationReasons must include an option with value = entered-in-error',
      });
    }
    return true;
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
