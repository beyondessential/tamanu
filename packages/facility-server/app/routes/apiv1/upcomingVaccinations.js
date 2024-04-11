import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { makeFilter } from '../../utils/query';
import { mapQueryFilters } from '../../database/utils';

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
  ];
  // facilityId

  return filters.filter(f => f);
};

upcomingVaccinations.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'PatientVaccine');

    const sortKeys = {
      vaccine: 'label',
      dueDate: 'due_date',
      date: 'due_date',
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
    console.log('whereClauses', whereClauses);

    const results = await req.db.query(
      `
      WITH upcoming_vaccinations_with_row_number AS (
        SELECT *,
        ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY due_date ASC) AS row_number
        FROM upcoming_vaccinations uv
      )
      SELECT
      p.id id,
      p.display_id "displayId",
      p.first_name "firstName",
      p.last_name "lastName",
      p.date_of_birth "dateOfBirth",
      p.sex,
      sv.id scheduledVaccineId,
      sv.category,
      sv.label "vaccineName",
      sv.schedule "scheduleName",
      sv.vaccine_id vaccineId,
      uv.due_date "dueDate",
      uv.status,
      village.name "villageName"
      FROM upcoming_vaccinations_with_row_number uv
      JOIN scheduled_vaccines sv ON sv.id = uv.scheduled_vaccine_id
      JOIN patients p ON p.id = uv.patient_id
      JOIN reference_data village ON village.id = p.village_id
      WHERE ${whereClauses}
      AND row_number = 1
      ORDER BY uv.due_date, sv.label;`,
      {
        replacements: {
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          ...filterReplacements,
        },
        type: QueryTypes.SELECT,
      },
    );

    return res.send({ data: results, count: results.length });
  }),
);
