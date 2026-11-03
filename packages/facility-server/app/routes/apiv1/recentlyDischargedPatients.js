import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { ENCOUNTER_TYPE_PATIENT_STATUSES } from '@tamanu/constants';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import {
  getWhereClausesAndReplacementsFromFilters,
  makeFilter,
  makeSubstringTextFilterFactory,
} from '../../utils/query';

// spec: RDISCH
export const recentlyDischargedPatients = express.Router();

const DEFAULT_ROWS_PER_PAGE = 10;
// The largest page size the web table offers
const MAX_ROWS_PER_PAGE = 50;

const SORT_KEYS = {
  firstName: 'UPPER(patients.first_name)',
  lastName: 'UPPER(patients.last_name)',
  dateOfBirth: 'patients.date_of_birth',
  sex: 'patients.sex',
  patientStatus: 'latest_discharges.patient_status',
  locationGroupName: 'UPPER(location_group.name)',
  departmentName: 'UPPER(department.name)',
  clinician: 'UPPER(discharger.display_name)',
  dischargeDate: 'latest_discharges.end_date',
};

// Search applies to every discharge in the window before each patient's most recent one is
// picked, so a patient whose latest discharge doesn't match is listed for an earlier one that does.
// spec: RDISCH#search
const createSearchFilters = filterParams => {
  const makeSubstringTextFilter = makeSubstringTextFilterFactory(filterParams);
  return [
    makeSubstringTextFilter('displayId', 'patients.display_id'),
    makeSubstringTextFilter('firstName', 'patients.first_name'),
    makeSubstringTextFilter('lastName', 'patients.last_name'),
    makeFilter(filterParams.patientStatus, 'patient_statuses.patient_status = :patientStatus'),
    makeFilter(filterParams.locationGroupId, 'locations.location_group_id = :locationGroupId'),
    makeFilter(filterParams.departmentId, 'encounters.department_id = :departmentId'),
    makeFilter(
      filterParams.dischargingClinicianId,
      'discharges.discharger_id = :dischargingClinicianId',
    ),
  ];
};

// Encounter types without a patient status (form responses, vaccination records) have no row in
// patient_statuses, so the inner join leaves them out. An encounter can carry more than one
// discharge record (e.g. after an offline sync conflict), so the newest one breaks the tie.
//
// The 24-hour window is an index range scan on encounters_end_date, and every other join is a key
// lookup (locations_pkey, patients_pkey, discharges_encounter_id). The work scales with the
// discharges in the window rather than the size of encounters, so running this for both the count
// and the page stays cheap.
// spec: RDISCH#which-discharges-are-listed
const buildLatestDischargesCte = searchClauses => `
  WITH patient_statuses (encounter_type, patient_status) AS (
    SELECT * FROM unnest(ARRAY[:listedEncounterTypes]::text[], ARRAY[:listedPatientStatuses]::text[])
  ),
  latest_discharges AS (
    SELECT DISTINCT ON (encounters.patient_id)
      encounters.patient_id,
      encounters.end_date,
      encounters.department_id,
      locations.location_group_id,
      patient_statuses.patient_status,
      discharges.discharger_id
    FROM encounters
      JOIN patient_statuses
        ON patient_statuses.encounter_type = encounters.encounter_type
      JOIN locations
        ON locations.id = encounters.location_id
      JOIN patients
        ON patients.id = encounters.patient_id
      LEFT JOIN discharges
        ON discharges.encounter_id = encounters.id AND discharges.deleted_at IS NULL
    WHERE encounters.end_date >= ((NOW() - INTERVAL '24 hours') AT TIME ZONE :primaryTimeZone)::date_time_string
      AND encounters.deleted_at IS NULL
      AND patients.deleted_at IS NULL
      AND locations.facility_id = :facilityId
      ${searchClauses ? `AND ${searchClauses}` : ''}
    ORDER BY
      encounters.patient_id,
      encounters.end_date DESC,
      encounters.id DESC,
      discharges.created_at DESC,
      discharges.id DESC
  )
`;

recentlyDischargedPatients.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const {
      orderBy = 'dischargeDate',
      order = 'desc',
      rowsPerPage,
      page,
      ...filterParams
    } = req.query;

    const limit = Math.min(
      Math.max(parseInt(rowsPerPage, 10) || DEFAULT_ROWS_PER_PAGE, 1),
      MAX_ROWS_PER_PAGE,
    );
    const offset = Math.max(parseInt(page, 10) || 0, 0) * limit;

    const sortKey = SORT_KEYS[orderBy] ?? SORT_KEYS.dischargeDate;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(
      createSearchFilters(filterParams),
      filterParams,
    );
    const latestDischargesCte = buildLatestDischargesCte(whereClauses);

    const replacements = {
      ...filterReplacements,
      listedEncounterTypes: Object.keys(ENCOUNTER_TYPE_PATIENT_STATUSES),
      listedPatientStatuses: Object.values(ENCOUNTER_TYPE_PATIENT_STATUSES),
      primaryTimeZone: getPrimaryTimeZone(),
      facilityId: req.facilityId,
    };

    const [{ count }] = await req.db.query(
      `
        ${latestDischargesCte}
        SELECT COUNT(1) AS count
        FROM latest_discharges
      `,
      { replacements, type: QueryTypes.SELECT },
    );

    if (Number(count) === 0) {
      res.send({ data: [], count: 0 });
      return;
    }

    const data = await req.db.query(
      `
        ${latestDischargesCte}
        SELECT
          patients.id,
          patients.display_id AS "displayId",
          patients.first_name AS "firstName",
          patients.last_name AS "lastName",
          patients.date_of_birth AS "dateOfBirth",
          patients.date_of_death AS "dateOfDeath",
          patients.sex,
          latest_discharges.patient_status AS "patientStatus",
          latest_discharges.end_date AS "dischargeDate",
          location_group.id AS "locationGroupId",
          location_group.name AS "locationGroupName",
          department.id AS "departmentId",
          department.name AS "departmentName",
          discharger.display_name AS clinician
        FROM latest_discharges
          JOIN patients
            ON patients.id = latest_discharges.patient_id
          LEFT JOIN location_groups AS location_group
            ON location_group.id = latest_discharges.location_group_id
          LEFT JOIN departments AS department
            ON department.id = latest_discharges.department_id
          LEFT JOIN users AS discharger
            ON discharger.id = latest_discharges.discharger_id
        ORDER BY
          ${sortKey} ${sortDirection} NULLS LAST,
          latest_discharges.end_date DESC,
          UPPER(patients.last_name) ASC,
          UPPER(patients.first_name) ASC,
          patients.id ASC
        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          ...replacements,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      },
    );

    res.send({ data, count: Number(count) });
  }),
);
