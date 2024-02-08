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
      collector: collectorRef(upstream),
    },
    type: sampleType(upstream),
    request: requestRef(upstream),
  };
}

function requestRef(labRequest) {
  return new FhirReference({
    type: 'upstream://service_request',
    reference: labRequest.id,
  });
}

function collectorRef(labRequest) {
  return new FhirReference({
    type: 'upstream://practitioner',
    reference: labRequest.collectedById,
  });
}

function sampleType(labRequest) {
  if (!labRequest.sampleId) return [];

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