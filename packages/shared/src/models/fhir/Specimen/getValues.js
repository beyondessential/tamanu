import { FhirContactPoint, FhirHumanName, FhirIdentifier } from '../../../services/fhirTypes';

export async function getValues(upstream, models) {
  const { LabRequest } = models;

  if (upstream instanceof LabRequest) return getValuesFromLabRequest(upstream);
  throw new Error(`Invalid upstream type for specimen ${upstream.constructor.name}`);
}

async function getValuesFromLabRequest(upstream) {
  return {
    lastUpdated: new Date(),
    sampleId: {
      sampleId: upstream.sampleId
    },
    sampleTime: upstream.sampleTime,
    // name: [
    //   new FhirHumanName({
    //     text: upstream.displayName,
    //   }),
    // ],
    // telecom: [
    //   new FhirContactPoint({
    //     system: 'email',
    //     value: upstream.email,
    //   }),
    // ],
  };
}

