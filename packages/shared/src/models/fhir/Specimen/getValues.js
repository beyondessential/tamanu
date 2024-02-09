import config from 'config';

import { FhirReference, FhirCoding, FhirCodeableConcept } from '../../../services/fhirTypes';

export async function getValues(upstream, models) {
  const { LabRequest } = models;

  if (upstream instanceof LabRequest) return getValuesFromLabRequest(upstream, models);
  throw new Error(`Invalid upstream type for specimen ${upstream.constructor.name}`);
}

async function getValuesFromLabRequest(upstream, models) {

  return {
    lastUpdated: new Date(),
    sampleTime: upstream.sampleTime,
    collection: {
      collectedDateTime: upstream.sampleTime,
      collector: collectorRef(upstream),
    },
    type: await resolveSpecimenType(upstream, models),
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

async function resolveSpecimenType(upstream, models) {
  const { ReferenceData } = models;
  const { specimenTypeId } = upstream;
  
  const specimenType = await ReferenceData.findOne({
    where: {
      id: specimenTypeId,
    }
  });
  if (!specimenType) return [];
  return new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: config.hl7.dataDictionaries.specimenType,
          code: specimenType.code,
          display: specimenType.name,
        }),
      ],
    });
}