import * as yup from 'yup';

const endpointStatuses = ['active', 'suspended', 'error', 'off', 'entered-in-error', 'test'];

export const FHIR_ENDPOINT_SCHEMA = yup.object({
  resourceType: yup
    .string()
    .oneOf(['Endpoint'])
    .required(),
  status: yup
    .string()
    .oneOf(endpointStatuses)
    .required(),
  address: yup.string().required(),
  connectionType: yup
    .object({
      code: yup.string().required(),
      display: yup.string().required(),
    })
    .required(),
  payloadType: yup
    .array()
    .of(yup.object({ code: yup.string().required(), display: yup.string().required() })),
});
