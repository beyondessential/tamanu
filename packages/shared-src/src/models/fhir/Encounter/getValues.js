import config from 'config';
import { identity } from 'lodash';

import {
  ENCOUNTER_TYPES,
  FHIR_DATETIME_PRECISION,
  FHIR_ENCOUNTER_CLASS_CODE,
  FHIR_ENCOUNTER_CLASS_DISPLAY,
  FHIR_ENCOUNTER_STATUS,
} from '../../../constants';
import {
  FhirCodeableConcept,
  FhirCoding,
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
    status: status(upstream),
    class: classification(upstream),
    actualPeriod: period(upstream),
    subject: subjectRef(upstream),
    location: locationRef(upstream),
  };
}

function compactBy(array, access = identity) {
  return array.filter(access);
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
