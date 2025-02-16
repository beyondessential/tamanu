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
  const collector = await collectorRef(upstream, models);
  const request = await requestRef(upstream, models);
  return {
    lastUpdated: new Date(),
    collection: createCollection(
      formatFhirDate(upstream.sampleTime),
      collector,
      await resolveBodySite(upstream, models),
    ),
    type: await resolveSpecimenType(upstream, models),
    request: [request],
    resolved: request.isResolved() && (collector ? collector.isResolved() : true),
  };
}

function createCollection(
  collectedDateTime: string | null,
  collector: Awaited<ReturnType<typeof collectorRef>>,
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

async function requestRef(labRequest: LabRequest, models: Models) {
  const serviceRequest = await models.FhirServiceRequest.findOne({
    where: { upstreamId: labRequest.id },
  });

  // We mark specimens as resolved if their request is materialised, since there is a circular dependency between FhirSpecimen and FhirServiceRequest
  // If we didn't do this then neither resource would ever be marked as resolved
  if (serviceRequest) {
    return FhirReference.resolved(models.FhirServiceRequest, serviceRequest.id);
  }

  return FhirReference.unresolved(models.FhirServiceRequest, labRequest.id);
}

async function collectorRef(labRequest: LabRequest, models: Models) {
  if (!labRequest.collectedById) return null;
  const collectedByUser = await models.User.findOne({ where: { id: labRequest.collectedById } });
  return FhirReference.to(models.FhirPractitioner, labRequest.collectedById, {
    display: collectedByUser?.displayName,
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
