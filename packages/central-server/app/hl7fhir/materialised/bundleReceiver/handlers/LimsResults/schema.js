import * as yup from 'yup';
import { FhirDiagnosticReport, FhirObservation } from '@tamanu/shared/models';
const basicResource = yup.object({
  resource: yup.object({
    resourceType: yup.string().required(),
    status: yup.string().required(),
  })
});

// Shallow match is finding a match at the higher structure
export const limsShallow = {
  entry: yup
    .array()
    .of(
      yup
        .object({
          resource: yup.object({
            resourceType: yup
              .mixed()
              .oneOf(['DiagnosticReport', 'Observation'])
              .required(),
            status: yup.string().required(),
          })
            .required(),
        }),
    ),
};

export const limsDeep = {
  entry: yup
    .array()
    .of(
      yup
        .lazy((val => {
          console.log({ val: JSON.stringify(val) });
          if (val.resource?.resourceType === 'DiagnosticReport') {
            console.log('DiagnosticReport');
            return yup.object({
              resource: FhirDiagnosticReport.INTAKE_SCHEMA,
            });
          } else if (val.resource?.resourceType === 'Observation') {
            console.log('Observation');
            return yup.object({
              resource: FhirObservation
              .INTAKE_SCHEMA,
            });
          }
          return basicResource;
        })),
    )
    .required(),
};