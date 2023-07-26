import config from 'config';
import { identity } from 'lodash';

import { activeFromVisibility } from '../utils';
import { FHIR_DATETIME_PRECISION } from '@tamanu/constants';
import {
  FhirAddress,
  FhirContactPoint,
  FhirHumanName,
  FhirIdentifier,
  FhirPatientLink,
  FhirReference,
} from '../../../services/fhirTypes';
import { nzEthnicity } from '../extensions';
import { formatFhirDate } from '../../../utils/fhir';

export async function getValues(upstream, models) {
  const { Patient } = models;

  if (upstream instanceof Patient) return getValuesFromPatient(upstream);
  throw new Error(`Invalid upstream type for patient ${upstream.constructor.name}`);
}

async function getValuesFromPatient(upstream) {
  const [first] = upstream.additionalData || [];
  // eslint-disable-next-line no-param-reassign
  upstream.additionalData = first;

  return {
    extension: extension(upstream),
    identifier: identifiers(upstream),
    active: activeFromVisibility(upstream),
    name: names(upstream),
    telecom: telecoms(upstream),
    gender: upstream.sex,
    birthDate: formatFhirDate(upstream.dateOfBirth, FHIR_DATETIME_PRECISION.DAYS),
    deceasedDateTime: formatFhirDate(upstream.dateOfDeath, FHIR_DATETIME_PRECISION.DAYS),
    address: addresses(upstream),
    link: await mergeLinks(upstream),
    lastUpdated: new Date(),
  };
}

function compactBy(array, access = identity) {
  return array.filter(access);
}

function extension(patient) {
  return [...nzEthnicity(patient)];
}

function identifiers(patient) {
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

function names(patient) {
  return compactBy([
    {
      use: 'official',
      prefix: compactBy([patient.additionalData?.title]),
      family: patient.lastName,
      given: compactBy([patient.firstName, patient.middleName]),
    },
    patient.culturalName && {
      use: 'nickname',
      text: patient.culturalName,
    },
  ]).map(i => new FhirHumanName(i));
}

function telecoms(patient) {
  return compactBy([
    patient.additionalData?.primaryContactNumber,
    patient.additionalData?.secondaryContactNumber,
  ]).map(
    (value, index) =>
      new FhirContactPoint({
        system: 'phone',
        rank: index + 1,
        value,
      }),
  );
}

function addresses(patient) {
  const { cityTown, streetVillage } = patient.additionalData || {};

  return [
    new FhirAddress({
      type: 'physical',
      use: 'home',
      city: cityTown,
      line: [streetVillage],
    }),
  ];
}

async function mergeLinks(patient) {
  const links = [];

  // Populates "upstream" links, which must be resolved to FHIR resource links
  // after materialisation by calling FhirResource.resolveUpstreams().

  if (patient.mergedIntoId) {
    const mergeTarget = await patient.getUltimateMergedInto();
    if (mergeTarget) {
      links.push(
        new FhirPatientLink({
          type: 'replaced-by',
          other: new FhirReference({
            reference: mergeTarget.id,
            type: 'upstream://patient',
            display: mergeTarget.displayId,
          }),
        }),
      );
    }
  }

  const down = await patient.getMergedDown();
  for (const mergedPatient of down) {
    if (mergedPatient.mergedIntoId === patient.id) {
      // if it's a merge directly into this patient
      links.push(
        new FhirPatientLink({
          type: 'replaces',
          other: new FhirReference({
            reference: mergedPatient.id,
            type: 'upstream://patient',
            display: mergedPatient.displayId,
          }),
        }),
      );
    } else {
      links.push(
        new FhirPatientLink({
          type: 'seealso',
          other: new FhirReference({
            reference: mergedPatient.id,
            type: 'upstream://patient',
            display: mergedPatient.displayId,
          }),
        }),
      );
    }
  }

  return links;
}
