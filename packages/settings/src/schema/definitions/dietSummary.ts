import * as yup from 'yup';

export const dietSummaryRegularDietIdSchema = {
  name: 'Regular diet',
  description:
    'The diet that stands for a regular meal. Patients with no diet recorded are counted under it on the diet summary sheet. Left unset anywhere, the sheet carries its own Regular column for them.',
  type: yup.string().nullable(),
  defaultValue: null,
  suggesterEndpoint: 'diet',
};

export const dietSummaryProperties = {
  regularDietId: dietSummaryRegularDietIdSchema,
};
