import * as yup from 'yup';

export const vitalEditReasonsSchema = yup.array(
  yup.object({
    value: yup.string().required(),
    label: yup.string().required(),
  }),
);

export const vitalEditReasonsDefault = [
  {
    value: 'incorrect-patient',
    label: 'Incorrect patient',
  },
  {
    value: 'incorrect-value',
    label: 'Incorrect value recorded',
  },
  {
    value: 'recorded-in-error',
    label: 'Recorded in error',
  },
  {
    value: 'other',
    label: 'Other',
  },
];
