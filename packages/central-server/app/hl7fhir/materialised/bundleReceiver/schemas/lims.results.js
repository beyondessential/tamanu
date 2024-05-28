import * as yup from 'yup';
import { FhirDiagnosticReport } from '@tamanu/shared/models';
const basicResource = yup.object({
  resource: yup.object({
    resourceType: yup.string().required(),
    status: yup.string().required(),
  })
});

export const limsResultShallow = {
  entry: yup.array().of(
    yup.object({
      resource: yup.object({
        resourceType: yup.mixed().oneOf(['DiagnosticReport','Observation']).required(),
        status: yup.string().required(),
      })
    }),
  ),
    // yup
    //   .mixed().oneOf([
    //     basicResource
        // .lazy((val => {
        //   console.log({ val });
        //   if (val.resource?.resourceType === 'DiagnosticReport') {
        //     console.log('DiagnosticReport');
        //     return basicResource;
        //   } else if (val.resource?.resourceType === 'Observation') {
        //     console.log('Observation');
        //     return basicResource;
        //   }
        //   return yup;
        // }))
      // ])

};
export const limsResultDeep = {
  entry: yup.array().of(
    yup.object({
      resource: FhirDiagnosticReport.INTAKE_SCHEMA,
    }),
  ),
};