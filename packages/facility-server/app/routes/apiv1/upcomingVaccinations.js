import express from 'express';
import config from 'config';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { VACCINE_STATUS } from '@tamanu/constants/vaccines';
import { makeFilter } from '../../utils/query';
import {
  MATERIALIZED_VIEWS,
  MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE,
} from '@tamanu/constants';

export const upcomingVaccinations = express.Router();

const THRESHOLD_DEFAULTS = JSON.stringify([
  { threshold: 28, status: 'SCHEDULED' },
  { threshold: 7, status: 'UPCOMING' },
  { threshold: -7, status: 'DUE' },
  { threshold: -55, status: 'OVERDUE' },
  { threshold: '-Infinity', status: 'MISSED' },
]);

const getFacilityToday = (countryTimeZone, facilityTimeZone) => {
  const tz = facilityTimeZone || countryTimeZone;
  return new Date().toLocaleDateString('en-CA', { timeZone: tz });
};

const createUpcomingVaccinationFilters = filterParams => {
  const filters = [
    makeFilter(
      filterParams.displayId,
      `(UPPER(p.display_id) LIKE UPPER(:displayId))`,
      ({ displayId }) => ({ displayId: `%${displayId}%` }),
    ),
    makeFilter(
      filterParams.firstName,
      `UPPER(p.first_name) LIKE UPPER(:firstName)`,
      ({ firstName }) => ({ firstName: `%${firstName}%` }),
    ),
    makeFilter(
      filterParams.lastName,
      `UPPER(p.last_name) LIKE UPPER(:lastName)`,
      ({ lastName }) => ({ lastName: `%${lastName}%` }),
    ),
    makeFilter(filterParams.sex, `p.sex = :sex`),
    makeFilter(filterParams.villageId, `p.village_id = :villageId`),
    makeFilter(filterParams.status, `uv.status = :status`),
  ];

  return filters.filter(f => f);
};

upcomingVaccinations.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientVaccine');

    const { facilityId, settings } = req;
    const facilityTimeZone = await settings[facilityId]?.get('facilityTimeZone');
    const facilityToday = getFacilityToday(config.countryTimeZone, facilityTimeZone);

    const sortKeys = {
      displayId: 'display_id',
      fullName: 'last_name',
      dateOfBirth: 'date_of_birth',
      sex: 'sex',
      villageName: 'village.name',
      vaccineDisplayName: 'sv.label',
      schedule: 'sv.dose_label',
      dueDate: 'due_date',
    };

    const {
      orderBy = 'dueDate',
      order = 'ASC',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = req.query;
    let sortKey = sortKeys[orderBy];
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const filters = createUpcomingVaccinationFilters(filterParams);
    const filterClauses = filters.map(f => f.sql).join(' AND ');
    const whereClauses = `uv.status <> 'MISSED' ${filterClauses ? `AND ${filterClauses}` : ''}`;

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        filterParams,
      );

    // Use the materialized version of the view if the regular refresh task is enabled, otherwise use the regular live view (not recommended for performance reasons)
    const { enabled } = config.schedules.refreshMaterializedView.upcomingVaccinations;
    const tableName =
      enabled === false ? 'upcoming_vaccinations' : 'materialized_upcoming_vaccinations';

    // Compute status at query time using the facility's timezone-aware "today",
    // since the materialized view no longer stores timezone-dependent columns.
    // When using the live view, this also ensures correct timezone handling
    // without needing SET TIME ZONE.
    const withStatusAndRowNumber = `
      WITH vaccine_settings AS (
        SELECT s.value AS thresholds, 1 AS priority
        FROM settings s
        WHERE s.deleted_at IS NULL
        AND s.key = 'upcomingVaccinations.thresholds'
        UNION
        SELECT :thresholdsDefault::jsonb, 0
        ORDER BY priority DESC LIMIT 1
      ),
      vaccine_thresholds AS (
        SELECT
          (jsonb_array_elements(s.thresholds) ->> 'threshold')::double precision AS threshold,
          jsonb_array_elements(s.thresholds) ->> 'status' AS status
        FROM vaccine_settings s
      ),
      upcoming_with_status AS (
        SELECT
          uv.patient_id,
          uv.scheduled_vaccine_id,
          uv.vaccine_category,
          uv.vaccine_id,
          uv.due_date,
          uv.due_date - :facilityToday::date AS days_till_due,
          (SELECT vst.status
           FROM vaccine_thresholds vst
           WHERE uv.due_date - :facilityToday::date > vst.threshold
           ORDER BY vst.threshold DESC
           LIMIT 1) AS status
        FROM ${tableName} uv
      ),
      upcoming_vaccinations_with_row_number AS (
        SELECT *,
        ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY due_date ASC) AS row_number
        FROM upcoming_with_status
        WHERE status <> '${VACCINE_STATUS.MISSED}'
      )
    `;

    const fromUpcomingVaccinations = `
      FROM upcoming_vaccinations_with_row_number uv
      JOIN scheduled_vaccines sv ON sv.id = uv.scheduled_vaccine_id
      JOIN patients p ON p.id = uv.patient_id
      LEFT JOIN reference_data village ON village.id = p.village_id
      WHERE ${whereClauses}
      AND row_number = 1
    `;

    const commonReplacements = {
      facilityToday,
      thresholdsDefault: THRESHOLD_DEFAULTS,
      ...filterReplacements,
    };

    const results = await req.db.query(
      `
      ${withStatusAndRowNumber}
      SELECT
      p.id id,
      p.display_id "displayId",
      p.first_name "firstName",
      p.last_name "lastName",
      p.date_of_birth "dateOfBirth",
      p.sex,
      sv.id "scheduledVaccineId",
      sv.category,
      sv.label "vaccineName",
      sv.dose_label "scheduleName",
      sv.vaccine_id "vaccineId",
      uv.due_date "dueDate",
      uv.status,
      village.name "villageName",
      village.id "villageId"
      ${fromUpcomingVaccinations}
      ORDER BY ${sortKey} ${sortDirection}, sv.label
      LIMIT :limit
      OFFSET :offset;`,
      {
        replacements: {
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          ...commonReplacements,
        },
        type: QueryTypes.SELECT,
      },
    );

    const countResult = await req.db.query(
      `
      ${withStatusAndRowNumber}
      SELECT COUNT(1) AS count ${fromUpcomingVaccinations};`,
      {
        replacements: commonReplacements,
        type: QueryTypes.SELECT,
      },
    );

    return res.send({
      data: results,
      count: parseInt(countResult[0].count, 10),
    });
  }),
);

upcomingVaccinations.get(
  '/updateStats',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { LocalSystemFact } = models;
    req.checkPermission('read', 'PatientVaccine');
    const { schedule, enabled } = config.schedules.refreshMaterializedView.upcomingVaccinations;
    if (enabled === false) {
      // If the task is disabled, stats are not needed
      return res.send({});
    }
    const lastRefreshed = await LocalSystemFact.get(
      `${MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE}:${MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS}`,
    );
    return res.send({
      lastRefreshed,
      schedule,
    });
  }),
);
