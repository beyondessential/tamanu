import config from 'config';
import { sub } from 'date-fns';
import { toDateString } from 'shared/utils/dateTime';
import { makeFilter } from './query';

export const createPatientFilters = filterParams => {
  const filters = [
    makeFilter(
      filterParams.displayId,
      `(UPPER(patients.display_id) LIKE UPPER(:displayId)${
        filterParams.matchSecondaryIds === 'true'
          ? ' OR UPPER(patient_secondary_ids.value) LIKE UPPER(:displayId)'
          : ''
      })`,
      ({ displayId }) => ({
        displayId: filterParams.displayIdExact === 'true' ? displayId : `%${displayId}%`,
      }),
    ),
    makeFilter(
      filterParams.firstName,
      `UPPER(patients.first_name) LIKE UPPER(:firstName)`,
      ({ firstName }) => ({ firstName: `${firstName}%` }),
    ),
    makeFilter(
      filterParams.lastName,
      `UPPER(patients.last_name) LIKE UPPER(:lastName)`,
      ({ lastName }) => ({ lastName: `${lastName}%` }),
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
    makeFilter(filterParams.departmentId, `department.id = :departmentId`),
    makeFilter(
      filterParams.facilityId === ':local' ? config.serverFacilityId : filterParams.facilityId,
      `department.facility_id = :facilityId`,
    ),
    makeFilter(filterParams.inpatient, `encounters.encounter_type = 'admission'`),
    makeFilter(filterParams.outpatient, `encounters.encounter_type = 'clinic'`),
    makeFilter(filterParams.clinicianId, `encounters.examiner_id = :clinicianId`),
  ].filter(f => f);

  return filters;
};
