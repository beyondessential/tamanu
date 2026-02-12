import config from 'config';
import { addSeconds, parseISO } from 'date-fns';

import {
  ENCOUNTER_TYPES,
  FHIR_ENCOUNTER_CLASS_CODE,
  FHIR_ENCOUNTER_CLASS_DISPLAY,
  FHIR_ENCOUNTER_LOCATION_STATUS,
  FHIR_ENCOUNTER_STATUS,
  FHIR_LOCATION_PHYSICAL_TYPE_CODE,
  FHIR_LOCATION_PHYSICAL_TYPE_DISPLAY,
} from '@tamanu/constants';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirEncounterLocation,
  FhirPeriod,
  FhirReference,
} from '@tamanu/shared/services/fhirTypes';
import { formatFhirDate } from '@tamanu/shared/utils/fhir';
import type { Model } from '../../../models/Model';
import type { Models } from '../../../types/model';
import type { Encounter } from '../../../models';

export async function getValues(upstream: Model, models: Models) {
  const { Encounter } = models;

  if (upstream instanceof Encounter) return getValuesFromEncounter(upstream, models);
  throw new Error(`Invalid upstream type for encounter ${upstream.constructor.name}`);
}

async function getValuesFromEncounter(upstream: Encounter, models: Models) {
  const subject = await subjectRef(upstream, models);
  const serviceProvider = await serviceProviderRef(upstream, models);

  return {
    lastUpdated: new Date(),
    status: status(upstream),
    class: classification(upstream),
    actualPeriod: period(upstream),
    subject,
    location: await locationRef(upstream, models),
    serviceProvider,
    resolved: subject.isResolved() && (serviceProvider ? serviceProvider.isResolved() : true),
  };
}

function status(encounter: Encounter) {
  if (encounter.discharge) {
    return FHIR_ENCOUNTER_STATUS.DISCHARGED;
  }

  return FHIR_ENCOUNTER_STATUS.IN_PROGRESS;
}

function classification(encounter: Encounter) {
  const code = classificationCode(encounter);
  if (!code) return [];

  return [
    new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: config.hl7.dataDictionaries.encounterClass,
          code,
          display:
            FHIR_ENCOUNTER_CLASS_DISPLAY[code as keyof typeof FHIR_ENCOUNTER_CLASS_DISPLAY] ?? null,
        }),
      ],
    }),
  ];
}

function classificationCode({ encounterType }: Encounter) {
  switch (encounterType) {
    case ENCOUNTER_TYPES.ADMISSION:
    case ENCOUNTER_TYPES.CLINIC:
    case ENCOUNTER_TYPES.IMAGING:
      return FHIR_ENCOUNTER_CLASS_CODE.IMP;

    case ENCOUNTER_TYPES.EMERGENCY:
    case ENCOUNTER_TYPES.TRIAGE:
      return FHIR_ENCOUNTER_CLASS_CODE.EMER;

    case ENCOUNTER_TYPES.OBSERVATION:
      return FHIR_ENCOUNTER_CLASS_CODE.OBSENC;

    case ENCOUNTER_TYPES.SURVEY_RESPONSE:
    case ENCOUNTER_TYPES.VACCINATION:
    case ENCOUNTER_TYPES.MEDICATION_DISPENSING:
    default:
      return null; // these should be filtered out (TODO EPI-452)
  }
}

function period(encounter: Encounter) {
  const start = parseISO(encounter.startDate);
  let end: Date | string | undefined = encounter.endDate;
  if (end) {
    end = parseISO(end);
    if (end <= start) {
      // should never happen in real usage, but test, imported, or migrated data
      // may do this; in that case satisfy Period's requirement that end > start.
      end = addSeconds(start, 1);
    }
  }

  return new FhirPeriod({
    start: formatFhirDate(start),
    end: end ? formatFhirDate(end) : null,
  });
}

function subjectRef(encounter: Encounter, models: Models) {
  return FhirReference.to(models.FhirPatient, encounter.patient?.id, {
    display: `${encounter.patient?.firstName} ${encounter.patient?.lastName}`,
  });
}

const { BED, WARD, JURISDICTION } = FHIR_LOCATION_PHYSICAL_TYPE_CODE;

async function locationRef(encounter: Encounter, models: Models) {
  const department = await models.Department.findOne({ where: { id: encounter.departmentId } });
  return [
    new FhirEncounterLocation({
      location: new FhirReference({
        display: department?.name,
        id: department?.id,
      }),
      status: FHIR_ENCOUNTER_LOCATION_STATUS.ACTIVE,
      physicalType: new FhirCodeableConcept({
        coding: [
          {
            system: config.hl7.dataDictionaries.locationPhysicalType,
            code: JURISDICTION,
            display: FHIR_LOCATION_PHYSICAL_TYPE_DISPLAY[JURISDICTION],
          },
        ],
      }),
    }),
    new FhirEncounterLocation({
      location: new FhirReference({
        display: encounter.location?.locationGroup?.name,
        id: encounter.location?.locationGroup?.id,
      }),
      status: FHIR_ENCOUNTER_LOCATION_STATUS.ACTIVE,
      physicalType: new FhirCodeableConcept({
        coding: [
          {
            system: config.hl7.dataDictionaries.locationPhysicalType,
            code: WARD,
            display: FHIR_LOCATION_PHYSICAL_TYPE_DISPLAY[WARD],
          },
        ],
      }),
    }),
    new FhirEncounterLocation({
      location: new FhirReference({
        display: encounter.location?.name,
        id: encounter.location?.id,
      }),
      status: FHIR_ENCOUNTER_LOCATION_STATUS.ACTIVE,
      physicalType: new FhirCodeableConcept({
        coding: [
          {
            system: config.hl7.dataDictionaries.locationPhysicalType,
            code: BED,
            display: FHIR_LOCATION_PHYSICAL_TYPE_DISPLAY[BED],
          },
        ],
      }),
    }),
  ];
}

async function serviceProviderRef(encounter: Encounter, models: Models) {
  const { facility } = encounter.location || {};
  if (!facility) {
    return null;
  }

  return FhirReference.to(models.FhirOrganization, facility.id, {
    display: facility.name,
  });
}
