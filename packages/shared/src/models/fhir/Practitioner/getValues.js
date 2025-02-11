import { FhirContactPoint, FhirHumanName, FhirIdentifier } from '../../../services/fhirTypes';

export async function getValues(upstream, models) {
  const { User } = models;

  if (upstream instanceof User) return getValuesFromUser(upstream);
  throw new Error(`Invalid upstream type for practitioner ${upstream.constructor.name}`);
}

async function getValuesFromUser(upstream) {
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
  };
}

function identifiers(user) {
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
