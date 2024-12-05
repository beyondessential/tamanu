import * as yup from 'yup';

export const imagingPrioritiesSchema = yup.array(
  yup.object({
    value: yup.string().required(),
    label: yup.string().required(),
  }),
);

export const imagingPrioritiesDefault = [
  {
    value: 'routine',
    label: 'Routine',
  },
  {
    value: 'urgent',
    label: 'Urgent',
  },
  {
    value: 'asap',
    label: 'ASAP',
  },
  {
    value: 'stat',
    label: 'STAT',
  },
];
