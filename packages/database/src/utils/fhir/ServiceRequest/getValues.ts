import config from 'config';

import {
  FHIR_REQUEST_INTENT,
  FHIR_REQUEST_PRIORITY,
  FHIR_REQUEST_STATUS,
  IMAGING_REQUEST_STATUS_TYPES,
  IMAGING_TABLE_STATUS_GROUPINGS,
  LAB_REQUEST_STATUSES,
  LAB_REQUEST_TABLE_STATUS_GROUPINGS,
  NOTE_TYPES,
} from '@tamanu/constants';

import { getNotesWithType } from '@tamanu/shared/utils/notes';
import {
  FhirAnnotation,
  FhirCodeableConcept,
  FhirCoding,
  FhirIdentifier,
  FhirReference,
} from '@tamanu/shared/services/fhirTypes';
import { Exception, formatFhirDate } from '@tamanu/shared/utils/fhir';
import type { Models } from '../../../types/model';
import type { Model } from '../../../models/Model';
import type { ImagingRequest, LabRequest, Note } from '../../../models';

export async function getValues(upstream: Model, models: Models) {
  const { ImagingRequest, LabRequest } = models;

  if (upstream instanceof ImagingRequest) return getValuesFromImagingRequest(upstream, models);
  if (upstream instanceof LabRequest) return getValuesFromLabRequest(upstream, models);
  throw new Error(`Invalid upstream type for service request ${upstream.constructor.name}`);
}

async function getValuesFromImagingRequest(upstream: ImagingRequest, models: Models) {
  const { ImagingAreaExternalCode } = models;

  const areaExtCodes = new Map(
    (
      await ImagingAreaExternalCode.findAll({
        where: {
          areaId: upstream.areas.map(area => area.id),
        },
      })
    ).map(ext => [
      ext.areaId,
      { code: ext.code, description: ext.description, updatedAt: ext.updatedAt },
    ]),
  );

  const subject = await FhirReference.to(models.FhirPatient, upstream.encounter?.patient?.id, {
    display: `${upstream.encounter?.patient?.firstName} ${upstream.encounter?.patient?.lastName}`,
  });
  const encounter = await FhirReference.to(models.FhirEncounter, upstream.encounter?.id);
  const requester = await FhirReference.to(models.FhirPractitioner, upstream.requestedBy?.id, {
    display: upstream.requestedBy?.displayName,
  });

  return {
    lastUpdated: new Date(),
    identifier: [
      new FhirIdentifier({
        system: config.hl7.dataDictionaries.serviceRequestImagingId,
        value: upstream.id,
      }),
      new FhirIdentifier({
        system: config.hl7.dataDictionaries.serviceRequestImagingDisplayId,
        value: upstream.displayId,
      }),
    ],
    status: statusFromImagingRequest(upstream),
    intent: FHIR_REQUEST_INTENT.ORDER._,
    category: [
      new FhirCodeableConcept({
        coding: [
          new FhirCoding({
            system: 'http://snomed.info/sct',
            code: '363679005',
          }),
        ],
      }),
    ],
    priority: validatePriority(upstream.priority),
    code: imagingCode(upstream),
    orderDetail: upstream.areas.flatMap(({ id }) =>
      areaExtCodes.has(id)
        ? [
            new FhirCodeableConcept({
              text: areaExtCodes.get(id)?.description,
              coding: [
                new FhirCoding({
                  code: areaExtCodes.get(id)?.code,
                  system: config.hl7.dataDictionaries.areaExternalCode,
                }),
              ],
            }),
          ]
        : [],
    ),
    subject,
    encounter,
    occurrenceDateTime: formatFhirDate(upstream.requestedDate),
    requester,
    locationCode: locationCode(upstream),
    note: imagingAnnotations(upstream),
    resolved: subject.isResolved() && encounter.isResolved() && requester.isResolved(),
  };
}

async function getValuesFromLabRequest(upstream: LabRequest, models: Models) {
  const subject = await FhirReference.to(models.FhirPatient, upstream.encounter?.patient?.id, {
    display: `${upstream.encounter?.patient?.firstName} ${upstream.encounter?.patient?.lastName}`,
  });
  const encounter = await FhirReference.to(models.FhirEncounter, upstream.encounter?.id);
  const requester = await FhirReference.to(models.FhirPractitioner, upstream.requestedBy?.id, {
    display: upstream.requestedBy?.displayName,
  });
  const specimen = await resolveSpecimen(upstream, models);

  return {
    lastUpdated: new Date(),
    identifier: [
      new FhirIdentifier({
        system: config.hl7.dataDictionaries.serviceRequestLabId,
        value: upstream.id,
      }),
      new FhirIdentifier({
        system: config.hl7.dataDictionaries.serviceRequestLabDisplayId,
        value: upstream.displayId,
      }),
    ],
    status: statusFromLabRequest(upstream),
    intent: FHIR_REQUEST_INTENT.ORDER._,
    category: [
      new FhirCodeableConcept({
        coding: [
          new FhirCoding({
            system: 'http://snomed.info/sct',
            code: '108252007',
          }),
        ],
      }),
    ],
    priority: validatePriority(upstream.priority?.name),
    code: labCode(upstream),
    orderDetail: labOrderDetails(upstream),
    subject,
    encounter,
    occurrenceDateTime: formatFhirDate(upstream.requestedDate),
    requester,
    note: labAnnotations(upstream),
    specimen: specimen ? [specimen] : null,
    resolved:
      subject.isResolved() &&
      encounter.isResolved() &&
      requester.isResolved() &&
      (specimen ? specimen.isResolved() : true),
  };
}

function resolveSpecimen(upstream: LabRequest, models: Models) {
  if (!upstream.specimenAttached) {
    return null;
  }
  return FhirReference.to(models.FhirSpecimen, upstream.id);
}

function imagingCode(upstream: ImagingRequest) {
  const { imagingTypes } = config.localisation.data;
  if (!imagingTypes) throw new Exception('No imaging types specified in localisation.');

  const { imagingType } = upstream;
  const { label } = imagingTypes[imagingType] || {};
  if (!label) throw new Exception(`No label matching imaging type ${imagingType} in localisation.`);

  return generateCodings(
    imagingType,
    undefined,
    label,
    config.hl7.dataDictionaries.serviceRequestImagingTypeCodeSystem,
  );
}

// Match the priority to a FHIR ServiceRequest priority where possible
// otherwise return null
// See: https://hl7.org/fhir/R4B/valueset-request-priority.html#expansion
function validatePriority(priority = '') {
  if (!Object.values(FHIR_REQUEST_PRIORITY).includes(priority)) {
    return null;
  }
  return priority;
}

function locationCode(upstream: ImagingRequest) {
  const facility =
    upstream.locationGroup?.facility ?? // most accurate
    upstream.location?.facility ?? // legacy data
    upstream.encounter?.location?.facility; // fallback to encounter
  if (!facility) return [];

  return [
    new FhirCodeableConcept({
      text: facility.name,
    }),
  ];
}

function statusFromImagingRequest(upstream: ImagingRequest) {
  return (
    {
      [IMAGING_REQUEST_STATUS_TYPES.CANCELLED]: FHIR_REQUEST_STATUS.REVOKED,
      [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: FHIR_REQUEST_STATUS.COMPLETED,
      [IMAGING_REQUEST_STATUS_TYPES.DELETED]: FHIR_REQUEST_STATUS.REVOKED,
      [IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR]: FHIR_REQUEST_STATUS.ENTERED_IN_ERROR,
      [IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]: FHIR_REQUEST_STATUS.ACTIVE,
      [IMAGING_REQUEST_STATUS_TYPES.PENDING]: FHIR_REQUEST_STATUS.DRAFT,
    }[upstream.status] ?? FHIR_REQUEST_STATUS.UNKNOWN
  );
}

function statusFromLabRequest(upstream: LabRequest) {
  switch (upstream.status) {
    case LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED:
    case LAB_REQUEST_STATUSES.RECEPTION_PENDING:
      return FHIR_REQUEST_STATUS.DRAFT;
    case LAB_REQUEST_STATUSES.RESULTS_PENDING:
    case LAB_REQUEST_STATUSES.INTERIM_RESULTS:
    case LAB_REQUEST_STATUSES.TO_BE_VERIFIED:
    case LAB_REQUEST_STATUSES.VERIFIED:
      return FHIR_REQUEST_STATUS.ACTIVE;
    case LAB_REQUEST_STATUSES.PUBLISHED:
      return FHIR_REQUEST_STATUS.COMPLETED;
    case LAB_REQUEST_STATUSES.CANCELLED:
    case LAB_REQUEST_STATUSES.INVALIDATED:
    case LAB_REQUEST_STATUSES.DELETED:
      return FHIR_REQUEST_STATUS.REVOKED;
    case LAB_REQUEST_STATUSES.ENTERED_IN_ERROR:
      return FHIR_REQUEST_STATUS.ENTERED_IN_ERROR;
    default:
      return FHIR_REQUEST_STATUS.UNKNOWN;
  }
}

export function getIsLive(upstream: Model, models: Models) {
  const { ImagingRequest, LabRequest } = models;

  if (upstream instanceof ImagingRequest)
    return IMAGING_TABLE_STATUS_GROUPINGS.ACTIVE.includes(upstream.status);
  if (upstream instanceof LabRequest)
    return LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE.includes(upstream.status);

  throw new Error(`Invalid upstream type for service request ${upstream.constructor.name}`);
}

export function shouldForceRematerialise(
  upstream: Model,
  downstream: { status: string } & Model,
  models: Models,
) {
  const { ImagingRequest, LabRequest } = models;

  // Force remateralisation on status change
  if (upstream instanceof ImagingRequest) {
    return statusFromImagingRequest(upstream) !== downstream.status;
  }
  if (upstream instanceof LabRequest) {
    return statusFromLabRequest(upstream) !== downstream.status;
  }

  throw new Error(`Invalid upstream type for service request ${upstream.constructor.name}`);
}

function labCode(upstream: LabRequest) {
  const { labTestPanelRequest } = upstream;

  // ServiceRequests may not have a panel
  if (!labTestPanelRequest) {
    return null;
  }
  const { externalCode, name, code } = labTestPanelRequest.labTestPanel || {};
  return generateCodings(
    code,
    externalCode,
    name,
    config.hl7.dataDictionaries.serviceRequestLabPanelCodeSystem,
    config.hl7.dataDictionaries.serviceRequestLabPanelExternalCodeSystem,
  );
}

function labOrderDetails({ tests }: LabRequest) {
  if (tests.length) {
    return tests.map(({ labTestType }) => {
      if (!labTestType) throw new Exception('Received a null test');

      const { externalCode, code, name } = labTestType;

      return generateCodings(
        code,
        externalCode,
        name,
        config.hl7.dataDictionaries.serviceRequestLabTestCodeSystem,
        config.hl7.dataDictionaries.serviceRequestLabTestExternalCodeSystem,
      );
    });
  }
  return [];
}

function labAnnotations(upstream: LabRequest) {
  return upstream.notes.map(note => {
    return new FhirAnnotation({
      time: formatFhirDate(note.date),
      text: note.content,
    });
  });
}

function imagingAnnotations(upstream: ImagingRequest) {
  // See EPI-451: imaging requests can embed notes about the area to image
  return getNotesWithType(upstream.notes, NOTE_TYPES.OTHER).map(
    (note: Note) =>
      new FhirAnnotation({
        time: formatFhirDate(note.date),
        text: note.content,
      }),
  );
}

function generateCodings(
  code: string | undefined,
  externalCode: string | undefined,
  name: string | undefined,
  codeSystem: string | undefined,
  externalCodeSystem?: string,
) {
  const coding = [];
  if (code) {
    coding.push(
      new FhirCoding({
        system: codeSystem,
        code,
        display: name,
      }),
    );
  }

  // Sometimes externalCode will not exists but if it does include it
  if (externalCode) {
    coding.push(
      new FhirCoding({
        system: externalCodeSystem,
        code: externalCode,
        display: name,
      }),
    );
  }
  if (coding.length > 0) {
    return new FhirCodeableConcept({
      coding,
      text: name,
    });
  }
  return null;
}
