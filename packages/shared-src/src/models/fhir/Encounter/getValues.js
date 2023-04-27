import config from 'config';
import { identity } from 'lodash';

import {
  ENCOUNTER_TYPES,
  FHIR_DATETIME_PRECISION,
  FHIR_ENCOUNTER_CLASS_CODE,
  FHIR_ENCOUNTER_CLASS_DISPLAY,
} from '../../../constants';
import {
  FhirCodeableConcept,
  FhirCoding,
  FhirIdentifier,
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
  const [first] = upstream.additionalData || [];
  // eslint-disable-next-line no-param-reassign
  upstream.additionalData = first;

  return {
    identifier: identifiers(upstream),
    status: status(upstream),
    class: classification(upstream),
    subject: subjectRef(upstream),
    actualPeriod: period(upstream),
    location: locationRef(upstream),
  };
}

function compactBy(array, access = identity) {
  return array.filter(access);
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

function identifiers(encounter) {
  return compactBy(
    [
      {
        use: 'usual',
        value: patient.displayId,
        assigner: new FhirReference({
          display: config.hl7.assigners.patientDisplayId,
        }),
        system: config.hl7.dataDictionaries.patientDisplayId,
      },
      {
        use: 'secondary',
        assigner: new FhirReference({
          display: config.hl7.assigners.patientPassport,
        }),
        value: patient.additionalData?.passportNumber,
      },
      {
        use: 'secondary',
        assigner: new FhirReference({
          display: config.hl7.assigners.patientDrivingLicense,
        }),
        value: patient.additionalData?.drivingLicense,
      },
    ],
    x => x.value,
  ).map(i => new FhirIdentifier(i));
}
