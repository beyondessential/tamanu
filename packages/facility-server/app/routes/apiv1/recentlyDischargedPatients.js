import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { ENCOUNTER_TYPE_PATIENT_STATUSES } from '@tamanu/constants';
import { getPrimaryTimeZone } from '@tamanu/shared/utils/timeZoneCheck';
import {
  getWhereClausesAndReplacementsFromFilters,
  makeDeletedAtIsNullFilter,
  makeFilter,
  makeSubstringTextFilterFactory,
} from '../../utils/query';

// spec: RDISCH
export const recentlyDischargedPatients = express.Router();

const SORT_KEYS = {
  firstName: 'UPPER(patients.first_name)',
  lastName: 'UPPER(patients.last_name)',
  dateOfBirth: 'patients.date_of_birth',
  sex: 'patients.sex',
  patientStatus: 'latest_discharges.patient_status',
  departmentName: 'department.name',
  clinician: 'discharger.display_name',
  dischargeDate: 'latest_discharges.end_date',
};

// Search applies to each patient's most recent discharge only, so these filters run against
// the deduplicated rows rather than inside latest_discharges.
// spec: RDISCH#search
const createFilters = filterParams => {
  const makeSubstringTextFilter = makeSubstringTextFilterFactory(filterParams);
  return [
    makeSubstringTextFilter('displayId', 'patients.display_id'),
    makeSubstringTextFilter('firstName', 'patients.first_name'),
    makeSubstringTextFilter('lastName', 'patients.last_name'),
    makeFilter(filterParams.patientStatus, 'latest_discharges.patient_status = :patientStatus'),
    makeFilter(filterParams.departmentId, 'latest_discharges.department_id = :departmentId'),
    makeFilter(
      filterParams.dischargingClinicianId,
      'latest_discharges.discharger_id = :dischargingClinicianId',
    ),
    makeDeletedAtIsNullFilter('patients'),
  ];
};

// Encounter types without a patient status (form responses, vaccination records) have no row in
// patient_statuses, so the inner join leaves them out.
// spec: RDISCH#which-discharges-are-listed
const LATEST_DISCHARGES_CTE = `
  WITH patient_statuses (encounter_type, patient_status) AS (
    SELECT * FROM unnest(ARRAY[:listedEncounterTypes]::text[], ARRAY[:listedPatientStatuses]::text[])
  ),
  latest_discharges AS (
    SELECT DISTINCT ON (encounters.patient_id)
      encounters.patient_id,
      encounters.end_date,
      encounters.department_id,
      patient_statuses.patient_status,
      discharges.discharger_id
    FROM encounters
      JOIN patient_statuses
        ON patient_statuses.encounter_type = encounters.encounter_type
      JOIN locations
        ON locations.id = encounters.location_id
      LEFT JOIN discharges
        ON discharges.encounter_id = encounters.id AND discharges.deleted_at IS NULL
    WHERE encounters.end_date >= ((NOW() - INTERVAL '24 hours') AT TIME ZONE :primaryTimeZone)::date_time_string
      AND encounters.deleted_at IS NULL
      AND locations.facility_id = :facilityId
    ORDER BY encounters.patient_id, encounters.end_date DESC, encounters.id DESC
  )
`;

recentlyDischargedPatients.get(
  '/',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Patient');

    const {
      orderBy = 'dischargeDate',
      order = 'desc',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = req.query;

    const sortKey = SORT_KEYS[orderBy] ?? SORT_KEYS.dischargeDate;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(
      createFilters(filterParams),
      filterParams,
    );

    const replacements = {
      ...filterReplacements,
      listedEncounterTypes: Object.keys(ENCOUNTER_TYPE_PATIENT_STATUSES),
      listedPatientStatuses: Object.values(ENCOUNTER_TYPE_PATIENT_STATUSES),
      primaryTimeZone: getPrimaryTimeZone(),
      facilityId: req.facilityId,
    };

    const from = `
      FROM latest_discharges
        JOIN patients
          ON patients.id = latest_discharges.patient_id
        LEFT JOIN departments AS department
          ON department.id = latest_discharges.department_id
        LEFT JOIN users AS discharger
          ON discharger.id = latest_discharges.discharger_id
      WHERE ${whereClauses}
    `;

    const [{ count }] = await req.db.query(
      `
        ${LATEST_DISCHARGES_CTE}
        SELECT COUNT(1) AS count
        ${from}
      `,
      { replacements, type: QueryTypes.SELECT },
    );

    if (Number(count) === 0) {
      res.send({ data: [], count: 0 });
      return;
    }

    const data = await req.db.query(
      `
        ${LATEST_DISCHARGES_CTE}
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
          department.id AS "departmentId",
          department.name AS "departmentName",
          discharger.display_name AS clinician
        ${from}
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
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        type: QueryTypes.SELECT,
      },
    );

    res.send({ data, count: Number(count) });
  }),
);
