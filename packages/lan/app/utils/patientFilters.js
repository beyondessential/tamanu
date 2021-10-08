import moment from 'moment';
import { makeFilter } from '~/utils/query';

export const createPatientFilters = filterParams => {
  const filters = [
    makeFilter(
      filterParams.displayId,
      `UPPER(patients.display_id) LIKE UPPER(:displayId)`,
      ({ displayId }) => ({ displayId: `%${displayId}%` }),
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
    // For age filter
    makeFilter(filterParams.ageMax, `patients.date_of_birth >= :dobMin`, ({ ageMax }) => ({
      dobMin: moment()
        .startOf('day')
        .subtract(ageMax + 1, 'years')
        .add(1, 'day')
        .toDate(),
    })),
    makeFilter(filterParams.ageMin, `patients.date_of_birth <= :dobMax`, ({ ageMin }) => ({
      dobMax: moment()
        .subtract(ageMin, 'years')
        .endOf('day')
        .toDate(),
    })),
    // For DOB filter
    makeFilter(
      filterParams.dateOfBirthFrom,
      `DATE(patients.date_of_birth) >= :dateOfBirthFrom`,
      ({ dateOfBirthFrom }) => ({
        dateOfBirthFrom: moment(dateOfBirthFrom)
          .startOf('day')
          .toISOString(),
      }),
    ),
    makeFilter(
      filterParams.dateOfBirthTo,
      `DATE(patients.date_of_birth) <= :dateOfBirthTo`,
      ({ dateOfBirthTo }) => ({
        dateOfBirthTo: moment(dateOfBirthTo)
          .endOf('day')
          .toISOString(),
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
    makeFilter(filterParams.inpatient, `encounters.encounter_type = 'admission'`),
    makeFilter(filterParams.outpatient, `encounters.encounter_type = 'clinic'`),
  ].filter(f => f);

  return filters;
};
