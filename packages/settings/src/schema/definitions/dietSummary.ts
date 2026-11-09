import * as yup from 'yup';

export const dietSummaryRegularDietIdSchema = {
  name: 'Regular diet',
  description:
    'The diet that stands for a regular meal, deployment-wide. Patients with no diet recorded are counted under it on the diet summary sheet. A facility can override this in its own bed management settings. Left unset anywhere, the sheet carries its own Regular column for them.',
  type: yup.string().nullable(),
  defaultValue: null,
  suggesterEndpoint: 'diet',
};
