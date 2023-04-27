import config from 'config';
import { identity } from 'lodash';

import { FHIR_DATETIME_PRECISION } from '../../../constants';
import {
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

function status(encounter) {
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
