import * as yup from 'yup';

// may extend to include batch and others: https://hl7.org/fhir/R4B/valueset-bundle-type.html
const POSTABLE_BUNDLE_TYPES = [
  'transaction',
];

export const bundlesCommon = {
  resourceType: yup
    .string()
    .test(
      'is-bundle',
      'must be Bundle',
      v => v === 'Bundle',
    )
    .required(),
  id: yup
    .string()
    .required(),
  type: yup
    .string()
    .test(
      'valid-bundle-type',
      `supported bundle types: ${POSTABLE_BUNDLE_TYPES.join()}`,
      t => POSTABLE_BUNDLE_TYPES.includes(t),
    ),
    entry: yup
      .array()
      .required(),
};