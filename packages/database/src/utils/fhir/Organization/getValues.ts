import { FhirIdentifier } from '@tamanu/shared/services/fhirTypes';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import type { Models } from '../../../types/model';
import type { Model } from '../../../models/Model';
import type { Facility } from '../../../models/Facility';

export async function getValues(upstream: Model, models: Models) {
  const { Facility } = models;

  if (upstream instanceof Facility) return getValuesFromFacility(upstream);
  throw new Error(`Invalid upstream type for organization ${upstream.constructor.name}`);
}

async function getValuesFromFacility(upstream: Facility) {
  return {
    lastUpdated: new Date(),
    identifier: [
      new FhirIdentifier({
        value: upstream.code,
      }),
    ],
    name: upstream.name,
    active: getActive(upstream),
    resolved: true,
  };
}

function getActive(facility: Facility) {
  if (facility === null) return null;
  return facility.visibilityStatus === VISIBILITY_STATUSES.CURRENT;
}
