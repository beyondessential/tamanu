import config from 'config';
import { addSeconds, parseISO } from 'date-fns';

import {
  ENCOUNTER_TYPES,
  FHIR_ENCOUNTER_CLASS_CODE,
  FHIR_ENCOUNTER_CLASS_DISPLAY,
  FHIR_ENCOUNTER_LOCATION_STATUS,
  FHIR_ENCOUNTER_STATUS,
} from '../../../constants';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirEncounterLocation,
  FhirPeriod,
  FhirReference,
} from '../../../services/fhirTypes';
import { formatFhirDate } from '../../../utils/fhir';

export async function getValues(upstream, models) {
  const { Encounter } = models;

  if (upstream instanceof Encounter) return getValuesFromEncounter(upstream);
  throw new Error(`Invalid upstream type for encounter ${upstream.constructor.name}`);
}

async function getValuesFromEncounter(upstream) {
  return {
    lastUpdated: new Date(),
    status: status(upstream),
    class: classification(upstream),
    actualPeriod: period(upstream),
    subject: subjectRef(upstream),
    location: locationRef(upstream),
  };
}

function status(encounter) {
  if (encounter.discharge) {
    return FHIR_ENCOUNTER_STATUS.DISCHARGED;
  }

  return FHIR_ENCOUNTER_STATUS.IN_PROGRESS;
}

function classification(encounter) {
  const code = classificationCode(encounter);
  if (!code) return [];

  return [
    new FhirCodeableConcept({
      coding: [
        new FhirCoding({
          system: config.hl7.dataDictionaries.encounterClass,
          code,
          display: FHIR_ENCOUNTER_CLASS_DISPLAY[code] ?? null,
        }),
      ],
    }),
  ];
}

function classificationCode({ encounterType }) {
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
    default:
      return null; // these should be filtered out (TODO EPI-452)
  }
}

function period(encounter) {
  const start = parseISO(encounter.startDate);
  let end = encounter.endDate;
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

function subjectRef(encounter) {
  return new FhirReference({
    type: 'upstream://patient',
    reference: encounter.patient.id,
    display: `${encounter.patient.firstName} ${encounter.patient.lastName}`,
  });
}

function locationRef(encounter) {
  return [
    new FhirEncounterLocation({
      location: new FhirReference({
        display: encounter.location.name,
        id: encounter.location.id,
      }),
      status: FHIR_ENCOUNTER_LOCATION_STATUS.ACTIVE,
    }),
  ];
}
