import express from 'express';
import config from 'config';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { VACCINE_STATUS } from '@tamanu/constants/vaccines';
import { makeFilter } from '../../utils/query';
import { getTranslatedCronParser } from '../../../dist/utils/getTranslatedCronParser';
import {
  MATERIALIZED_VIEWS,
  MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE,
} from '@tamanu/constants';

export const upcomingVaccinations = express.Router();

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

    const sortKeys = {
      displayId: 'display_id',
      fullName: 'last_name',
      dateOfBirth: 'date_of_birth',
      sex: 'sex',
      villageName: 'village.name',
      vaccineDisplayName: 'sv.label',
      schedule: 'sv.schedule',
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

    // If the refreshMaterializedView task is disabled, use the upcoming_vaccinations view
    const { enabled } = config.schedules.refreshMaterializedView.upcomingVaccinations;
    const tableName =
      enabled === false ? 'upcoming_vaccinations' : 'materialized_upcoming_vaccinations';

    const withRowNumber = `
      WITH upcoming_vaccinations_with_row_number AS (
        SELECT *,
        ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY due_date ASC) AS row_number
        FROM ${tableName} uv
        WHERE uv.status <> '${VACCINE_STATUS.MISSED}'
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

    const results = await req.db.query(
      `
      ${withRowNumber}
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
      sv.schedule "scheduleName",
      sv.vaccine_id "vaccineId",
      uv.due_date "dueDate",
      uv.status,
      village.name "villageName"
      ${fromUpcomingVaccinations}
      ORDER BY ${sortKey} ${sortDirection}, sv.label
      LIMIT :limit
      OFFSET :offset;`,
      {
        replacements: {
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          ...filterReplacements,
        },
        type: QueryTypes.SELECT,
      },
    );

    const countResult = await req.db.query(
      `
      ${withRowNumber}
      SELECT COUNT(1) AS count ${fromUpcomingVaccinations};`,
      {
        replacements: filterReplacements,
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
  '/refreshStats',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientVaccine');
    const { models, query } = req;
    const { language } = query;
    const { schedule, enabled } = config.schedules.refreshMaterializedView.upcomingVaccinations;

    if (enabled === false) {
      // If the task is disabled, stats are not needed
      return res.send({});
    }
    const parseCronExpression = await getTranslatedCronParser(models, language);
    return res.send({
      lastRefreshed: await req.models.LocalSystemFact.get(
        `${MATERIALIZED_VIEW_LAST_REFRESHED_AT_KEY_NAMESPACE}:${MATERIALIZED_VIEWS.UPCOMING_VACCINATIONS}`,
      ),
      schedule: parseCronExpression(schedule),
    });
  }),
);
