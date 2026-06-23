import { makeFilter } from './query';

export const createTriageFilters = filterParams => {
  return [
    makeFilter(
      filterParams.displayId,
      `UPPER(patients.display_id) LIKE UPPER(:displayId)`,
      ({ displayId }) => ({ displayId: `%${displayId}%` }),
    ),
    makeFilter(
      filterParams.firstName,
      `UPPER(patients.first_name) LIKE UPPER(:firstName)`,
      ({ firstName }) => ({ firstName: `%${firstName}%` }),
    ),
    makeFilter(
      filterParams.lastName,
      `UPPER(patients.last_name) LIKE UPPER(:lastName)`,
      ({ lastName }) => ({ lastName: `%${lastName}%` }),
    ),
    makeFilter(filterParams.clinicianId, `encounters.examiner_id = :clinicianId`),
    makeFilter(filterParams.score, `triages.score = :score`),
    makeFilter(filterParams.locationGroupId, `location_group.id = :locationGroupId`),
    makeFilter(filterParams.locationId, `location.id = :locationId`),
  ].filter(f => f);
};
