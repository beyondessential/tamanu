import { sub, startOfDay, endOfDay } from 'date-fns';
import { makeFilter } from './query';

export const createPatientFilters = filterParams => {
  const filters = [
    makeFilter(
      filterParams.displayId,
      `UPPER(patients.display_id) LIKE UPPER(:displayId)`,
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
    makeFilter(
      filterParams.ageMax,
      `DATE(patients.date_of_birth) >= DATE(:dobMin)`,
      ({ ageMax }) => ({
        // Subtract the number of years, but add one day
        dobMin: sub(new Date(), { years: ageMax + 1, days: -1 }),
      }),
    ),
    makeFilter(
      filterParams.ageMin,
      `DATE(patients.date_of_birth) <= DATE(:dobMax)`,
      ({ ageMin }) => ({
        dobMax: sub(new Date(), { years: ageMin }),
      }),
    ),
    // For DOB filter
    makeFilter(
      filterParams.dateOfBirthFrom,
      `DATE(patients.date_of_birth) >= :dateOfBirthFrom`,
      ({ dateOfBirthFrom }) => ({
        dateOfBirthFrom: startOfDay(dateOfBirthFrom).toISOString(),
      }),
    ),
    makeFilter(
      filterParams.dateOfBirthTo,
      `DATE(patients.date_of_birth) <= :dateOfBirthTo`,
      ({ dateOfBirthTo }) => ({
        dateOfBirthTo: endOfDay(dateOfBirthTo).toISOString(),
      }),
    ),
    makeFilter(
      filterParams.dateOfBirthExact,
      `DATE(patients.date_of_birth) = :dateOfBirthExact`,
      ({ dateOfBirthExact }) => ({
        dateOfBirthExact,
      }),
    ),
    makeFilter(filterParams.villageId, `patients.village_id = :villageId`),
    makeFilter(filterParams.locationId, `location.id = :locationId`),
    makeFilter(filterParams.departmentId, `department.id = :departmentId`),
    makeFilter(filterParams.facilityId, `department.facility_id = :facilityId`),
    makeFilter(filterParams.inpatient, `encounters.encounter_type = 'admission'`),
    makeFilter(filterParams.outpatient, `encounters.encounter_type = 'clinic'`),
    makeFilter(filterParams.clinicianId, `encounters.examiner_id = :clinicianId`),
  ].filter(f => f);

  return filters;
};
