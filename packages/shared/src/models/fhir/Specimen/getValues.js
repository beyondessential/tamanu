import config from 'config';

import { FhirReference, FhirCoding, FhirCodeableConcept } from '../../../services/fhirTypes';

export async function getValues(upstream, models) {
  const { LabRequest } = models;

  if (upstream instanceof LabRequest) return getValuesFromLabRequest(upstream);
  throw new Error(`Invalid upstream type for specimen ${upstream.constructor.name}`);
}

async function getValuesFromLabRequest(upstream) {
  console.log({ upstream });
  return {
    lastUpdated: new Date(),
    sampleTime: upstream.sampleTime,
    collection: {
      collectedDateTime: upstream.sampleTime,
      collector: upstream.collectedBy,
    },
    type: sampleType(upstream),
    request: requestRef(upstream),
  };
}

function requestRef(labRequest) {
  const refToLabRequest = new FhirReference({
    type: 'upstream://serviceRequest',
    reference: labRequest.id,
    display: `${labRequest.displayId}`,
  });
  console.log({ refToLabRequest });
  return refToLabRequest;
}

function sampleType(labRequest) {
  // const code = classificationCode(labRequest);
  // if (!code) return [];

  return [
    new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: config.hl7.dataDictionaries.specimenType,
          code: labRequest.sampleId, // Todo: map to external code
          display: null,
        }),
      ],
    }),
  ];
}