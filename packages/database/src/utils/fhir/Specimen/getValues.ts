import config from 'config';

import { FhirReference, FhirCoding, FhirCodeableConcept } from '@tamanu/shared/services/fhirTypes';
import { formatFhirDate } from '@tamanu/shared/utils/fhir';
import type { Models } from '../../../types/model';
import type { LabRequest } from '../../../models';
import type { Model } from '../../../models/Model';

export async function getValues(upstream: Model, models: Models) {
  const { LabRequest } = models;

  if (upstream instanceof LabRequest) return getValuesFromLabRequest(upstream, models);
  throw new Error(`Invalid upstream type for specimen ${upstream.constructor.name}`);
}

async function getValuesFromLabRequest(upstream: LabRequest, models: Models) {
  return {
    lastUpdated: new Date(),
    collection: createCollection(
      formatFhirDate(upstream.sampleTime),
      collectorRef(upstream),
      await resolveBodySite(upstream, models),
    ),
    type: await resolveSpecimenType(upstream, models),
    request: [requestRef(upstream)],
  };
}

function createCollection(
  collectedDateTime: string | null,
  collector: ReturnType<typeof collectorRef>,
  bodySite: Awaited<ReturnType<typeof resolveBodySite>>,
) {
  return collectedDateTime === null && collector === null && bodySite === null
    ? null
    : {
        collectedDateTime,
        collector,
        bodySite,
      };
}

function requestRef(labRequest: LabRequest) {
  return new FhirReference({
    type: 'upstream://service_request',
    reference: labRequest.id,
  });
}

function collectorRef(labRequest: LabRequest) {
  if (!labRequest.collectedById) return null;
  return new FhirReference({
    type: 'upstream://practitioner',
    reference: labRequest.collectedById,
  });
}

async function resolveBodySite(upstream: LabRequest, models: Models) {
  const { ReferenceData } = models;
  const { labSampleSiteId } = upstream;

  const bodySite = await ReferenceData.findOne({
    where: {
      id: labSampleSiteId,
    },
  });
  if (!bodySite) return null;
  return new FhirCodeableConcept({
    coding: [
      new FhirCoding({
        system: config.hl7.dataDictionaries.sampleBodySite,
        code: bodySite.code,
        display: bodySite.name,
      }),
    ],
  });
}

async function resolveSpecimenType(upstream: LabRequest, models: Models) {
  const { ReferenceData } = models;
  const { specimenTypeId } = upstream;

  const specimenType = await ReferenceData.findOne({
    where: {
      id: specimenTypeId,
    },
  });
  if (!specimenType) return null;
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
