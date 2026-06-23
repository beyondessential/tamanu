import * as yup from 'yup';

export const triageCategoriesSchema = yup
  .array(
    yup.object({
      level: yup.number().required(),
      label: yup.string().required(),
      color: yup.string().required(),
    }),
  )
  .min(3)
  .max(5);

export const triageCategoriesDefault = [
  {
    level: 1,
    label: 'Emergency',
    color: '#F76853',
  },
  {
    level: 2,
    label: 'Very Urgent',
    color: '#F17F16',
  },
  {
    level: 3,
    label: 'Urgent',
    color: '#DCAE09',
  },
  {
    level: 4,
    label: 'Non-urgent',
    color: '#19934E',
  },
  {
    level: 5,
    label: 'Deceased',
    color: '#1172D1',
  },
];
