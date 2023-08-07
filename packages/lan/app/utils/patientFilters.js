import { sub } from 'date-fns';
import { toDateString } from 'shared/utils/dateTime';
import { ENCOUNTER_TYPES } from 'shared/constants';

import { makeFilter } from './query';

export const createPatientFilters = filterParams => {
  const filters = [
    makeFilter(
      filterParams.displayId,
      `(UPPER(patients.display_id) LIKE UPPER(:displayId)${
        filterParams.matchSecondaryIds === 'true'
          ? // need to cast the array to text and back to be able to uppercase it
            ' OR UPPER(:secondaryDisplayId) = ANY(UPPER(secondary_ids::text)::text[])'
          : ''
      })`,
      ({ displayId }) => ({
        displayId: `%${displayId}%`,
        secondaryDisplayId: displayId,
      }),
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
    makeFilter(
      filterParams.culturalName,
      `UPPER(patients.cultural_name) LIKE UPPER(:culturalName)`,
      ({ culturalName }) => ({ culturalName: `${culturalName}%` }),
    ),
    makeFilter(
      !filterParams.deceased || filterParams.deceased === 'false',
      `patients.date_of_death IS NULL`,
    ),
    // For age filter
    makeFilter(filterParams.ageMax, `patients.date_of_birth >= :dobMin`, ({ ageMax }) => ({
      // Subtract the number of years, but add one day
      dobMin: toDateString(sub(new Date(), { years: ageMax + 1, days: -1 })),
    })),
    makeFilter(filterParams.ageMin, `patients.date_of_birth <= :dobMax`, ({ ageMin }) => ({
      dobMax: toDateString(sub(new Date(), { years: ageMin })),
    })),
    // For DOB filter
    makeFilter(filterParams.dateOfBirthFrom, `patients.date_of_birth >= :dateOfBirthFrom`),
    makeFilter(filterParams.dateOfBirthTo, `patients.date_of_birth<= :dateOfBirthTo`),
    makeFilter(filterParams.dateOfBirthExact, `patients.date_of_birth = :dateOfBirthExact`),
    makeFilter(filterParams.villageId, `patients.village_id = :villageId`),
    makeFilter(filterParams.locationId, `location.id = :locationId`),
    makeFilter(filterParams.locationGroupId, `location_group.id = :locationGroupId`),
    makeFilter(filterParams.departmentId, `department.id = :departmentId`),
    makeFilter(filterParams.facilityId, `location.facility_id = :facilityId`),
    makeFilter(filterParams.inpatient, `encounters.encounter_type = 'admission'`),
    makeFilter(filterParams.outpatient, `encounters.encounter_type = 'clinic'`),
    makeFilter(filterParams.clinicianId, `encounters.examiner_id = :clinicianId`),
    makeFilter(filterParams.sex, `patients.sex = :sex`),
    makeFilter(
      filterParams.currentPatient,
      `encounters.encounter_type NOT IN (:currentPatientExcludeEncounterTypes)`,
      () => ({
        currentPatientExcludeEncounterTypes: [
          ENCOUNTER_TYPES.IMAGING,
          ENCOUNTER_TYPES.SURVEY_RESPONSE,
          ENCOUNTER_TYPES.VACCINATION,
        ],
      }),
    ),
  ].filter(f => f);

  return filters;
};
