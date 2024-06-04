import * as yup from 'yup';
import { FhirDiagnosticReport, FhirObservation } from '@tamanu/shared/models';


yup.addMethod(yup.array, 'oneOfSchemas', function (schemas) {
  return this.test(
    'one-of-schemas',
    'Not all items in ${path} match one of the allowed schemas',
    items => items.every(item => {
      return schemas.some(schema => schema.isValidSync(item, { strict: true }))
    })
  )
})


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

const diagnosticBundleEntry = yup.object({
  resource: {
    resourceType: FhirDiagnosticReport.INTAKE_SCHEMA,
  }
});

export const limsDeep = {
  entry: yup.array().oneOfSchemas([
    FhirDiagnosticReport.INTAKE_SCHEMA,
    FhirObservation.INTAKE_SCHEMA,
  ])
    // .lazy((val => {
    //   console.log({ val: JSON.stringify(val) });
    //   if (val.resource?.resourceType === 'DiagnosticReport') {
    //     console.log('DiagnosticReport');
    //     return yup.object({
    //       resource: FhirDiagnosticReport.INTAKE_SCHEMA,
    //     });
    //   } else if (val.resource?.resourceType === 'Observation') {
    //     console.log('Observation');
    //     return yup.object({
    //       resource: FhirObservation
    //       .INTAKE_SCHEMA,
    //     });
    //   }
    //   return yup.object();

    // })),
    .required(),
};