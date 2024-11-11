import config from 'config';

import { FhirReference, FhirCoding, FhirCodeableConcept } from '../../../services/fhirTypes';
import { formatFhirDate } from '../../../utils/fhir';
import { FhirServiceRequest } from '../ServiceRequest/FhirServiceRequest';
import { FhirPractitioner } from '../Practitioner/FhirPractitioner';

export async function getValues(upstream, models) {
  const { LabRequest } = models;

  if (upstream instanceof LabRequest) return getValuesFromLabRequest(upstream, models);
  throw new Error(`Invalid upstream type for specimen ${upstream.constructor.name}`);
}

async function getValuesFromLabRequest(upstream, models) {
  return {
    lastUpdated: new Date(),
    collection: createCollection(
      formatFhirDate(upstream.sampleTime),
      await collectorRef(upstream, models),
      await resolveBodySite(upstream, models),
    ),
    type: await resolveSpecimenType(upstream, models),
    request: [await requestRef(upstream, models)],
  };
}

function createCollection(collectedDateTime, collector, bodySite) {
  return collectedDateTime === null && collector === null && bodySite === null
    ? null
    : {
        collectedDateTime,
        collector,
        bodySite,
      };
}

async function requestRef(labRequest, models) {
  return FhirReference.to(models.FhirServiceRequest, labRequest.id);
}

async function collectorRef(labRequest, models) {
  if (!labRequest.collectedById) return null;
  return FhirReference.to(models.FhirPractitioner, labRequest.collectedById);
}

async function resolveBodySite(upstream, models) {
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

async function resolveSpecimenType(upstream, models) {
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
