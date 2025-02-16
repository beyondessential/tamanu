import { FhirContactPoint, FhirHumanName, FhirIdentifier } from '@tamanu/shared/services/fhirTypes';
import type { Model } from '../../../models/Model';
import type { Models } from '../../../types/model';
import type { User } from '../../../models';

export async function getValues(upstream: Model, models: Models) {
  const { User } = models;

  if (upstream instanceof User) return getValuesFromUser(upstream);
  throw new Error(`Invalid upstream type for practitioner ${upstream.constructor.name}`);
}

async function getValuesFromUser(upstream: User) {
  return {
    lastUpdated: new Date(),
    identifier: identifiers(upstream),
    name: [
      new FhirHumanName({
        text: upstream.displayName,
      }),
    ],
    telecom: [
      new FhirContactPoint({
        system: 'email',
        value: upstream.email,
      }),
    ],
    resolved: true,
  };
}

function identifiers(user: User) {
  const practitionerIdentifiers = [
    new FhirIdentifier({
      use: 'secondary',
      value: user.id,
    }),
  ];

  if (user.displayId) {
    practitionerIdentifiers.push(
      new FhirIdentifier({
        use: 'usual',
        value: user.displayId,
      }),
    );
  }

  return practitionerIdentifiers;
}
