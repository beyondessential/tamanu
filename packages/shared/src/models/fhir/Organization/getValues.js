import { FhirIdentifier } from '../../../services/fhirTypes';

export async function getValues(upstream, models) {
  const { Facility } = models;

  if (upstream instanceof Facility) return getValuesFromFacility(upstream);
  throw new Error(`Invalid upstream type for organization ${upstream.constructor.name}`);
}

async function getValuesFromFacility(upstream) {
  return {
    lastUpdated: new Date(),
    identifier: [
      new FhirIdentifier({
        value: upstream.code,
      }),
    ],
    name: upstream.name,
    active: getActive(upstream)
  };
}

function getActive(facility) {
  if (facility === null) return null;
  return facility.visibilityStatus === 'current';
}
