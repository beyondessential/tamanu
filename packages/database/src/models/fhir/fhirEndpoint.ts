import * as yup from 'yup';

const endpointStatuses = ['active', 'suspended', 'error', 'off', 'entered-in-error', 'test'];

export type FhirEndpointType = yup.InferType<typeof FHIR_ENDPOINT_SCHEMA>;
export const FHIR_ENDPOINT_SCHEMA = yup.object({
  resourceType: yup
    .string()
    .oneOf(['Endpoint'], 'ImagingStudy only supports a contained Endpoint resource')
    .required(),
  status: yup.string().oneOf(endpointStatuses).required(),
  address: yup.string().required(),
  connectionType: yup
    .object({
      code: yup.string().required(),
      display: yup.string().required(),
    })
    .required(),
  payloadType: yup
    .array()
    .of(
      yup.object({
        code: yup
          .string()
          .oneOf(['none'], 'ImagingStudy contained Endpoint only supports a payload type of None')
          .required(),
        display: yup
          .string()
          .oneOf(['None'], 'ImagingStudy contained Endpoint only supports a payload type of None')
          .required(),
      }),
    )
    .required(),
});
