import config from 'config';

import { FHIR_DATETIME_PRECISION } from '@tamanu/constants';
import {
  FhirAddress,
  FhirContactPoint,
  FhirHumanName,
  FhirIdentifier,
  FhirPatientLink,
  FhirReference,
} from '@tamanu/shared/services/fhirTypes';
import { formatFhirDate } from '@tamanu/shared/utils/fhir';
import { activeFromVisibility } from '../utils';
import { nzEthnicity } from '../extensions';
import type { Model } from '../../../models/Model';
import type { Models } from '../../../types/model';
import type { Patient } from '../../../models';

export async function getValues(upstream: Model, models: Models) {
  const { Patient } = models;

  if (upstream instanceof Patient) return getValuesFromPatient(upstream, models);
  throw new Error(`Invalid upstream type for patient ${upstream.constructor.name}`);
}

async function getValuesFromPatient(upstream: Patient, models: Models) {
  const links = await mergeLinks(upstream, models);

  return {
    extension: extension(upstream),
    identifier: identifiers(upstream),
    active: activeFromVisibility(upstream),
    name: names(upstream),
    telecom: telecoms(upstream),
    gender: upstream.sex,
    birthDate: formatFhirDate(upstream.dateOfBirth, FHIR_DATETIME_PRECISION.DAYS),
    deceasedDateTime: formatFhirDate(upstream.dateOfDeath, FHIR_DATETIME_PRECISION.DAYS),
    address: await addresses(upstream, models),
    link: links,
    lastUpdated: new Date(),
    resolved: links.every(({ other }) => other.isResolved()),
  };
}

// eslint-disable-next-line no-unused-vars
function compactBy<T>(array: T[], access: (_value: T) => boolean = (value) => Boolean(value)) {
  return array.filter(access);
}

function extension(patient: Patient) {
  return [...nzEthnicity(patient)];
}

function identifiers(patient: Patient) {
  const additionalData = patient?.additionalData?.[0];

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
        value: additionalData?.passportNumber,
      },
      {
        use: 'secondary',
        assigner: new FhirReference({
          display: config.hl7.assigners.patientDrivingLicense,
        }),
        value: additionalData?.drivingLicense,
      },
    ],
    (x) => !!x.value,
  ).map((i) => new FhirIdentifier(i));
}

function names(patient: Patient) {
  const additionalData = patient?.additionalData?.[0];

  return compactBy([
    {
      use: 'official',
      prefix: compactBy([additionalData?.title]),
      family: patient.lastName,
      given: compactBy([patient.firstName, patient.middleName]),
    },
    patient.culturalName && {
      use: 'nickname',
      text: patient.culturalName,
    },
  ]).map((i) => new FhirHumanName(i));
}

function telecoms(patient: Patient) {
  const additionalData = patient?.additionalData?.[0];

  return compactBy([
    additionalData?.primaryContactNumber,
    additionalData?.secondaryContactNumber,
  ]).map(
    (value, index) =>
      new FhirContactPoint({
        system: 'phone',
        rank: index + 1,
        value,
      }),
  );
}

async function addresses(patient: Patient, models: Models) {
  const additionalData = patient?.additionalData?.[0];

  const { cityTown, streetVillage } = additionalData || {};
  const patientVillage = await models.ReferenceData.findByPk(patient.villageId);
  const village = patientVillage?.name || streetVillage;

  return [
    new FhirAddress({
      type: 'physical',
      use: 'home',
      city: cityTown,
      line: [village],
    }),
  ];
}

async function mergeLinks(patient: Patient, models: Models) {
  const links = [];

  // Populates "upstream" links, which must be resolved to FHIR resource links
  // after materialisation by calling FhirResource.resolveUpstreams().

  if (patient.mergedIntoId) {
    const mergeTarget = await patient.getUltimateMergedInto();
    if (mergeTarget) {
      links.push(
        new FhirPatientLink({
          type: 'replaced-by',
          other: await FhirReference.to(models.FhirPatient, mergeTarget.id, {
            display: mergeTarget.displayId,
          }),
        }) as FhirPatientLink & { other: FhirReference }, // TODO: Convert fhirTypes to TS
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
          other: await FhirReference.to(models.FhirPatient, mergedPatient.id, {
            display: mergedPatient.displayId,
          }),
        }) as FhirPatientLink & { other: FhirReference },
      );
    } else {
      links.push(
        new FhirPatientLink({
          type: 'seealso',
          other: await FhirReference.to(models.FhirPatient, mergedPatient.id, {
            display: mergedPatient.displayId,
          }),
        }) as FhirPatientLink & { other: FhirReference },
      );
    }
  }

  return links;
}
