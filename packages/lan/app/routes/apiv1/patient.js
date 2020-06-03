import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import moment from 'moment';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const patient = express.Router();

patient.get('/:id', simpleGet('Patient'));
patient.put('/:id', simplePut('Patient'));
patient.post('/$', simplePost('Patient'));

patient.get('/:id/visits', simpleGetList('Visit', 'patientId'));

const makeFilter = (check, sql, transform) => {
  if (!check) return null;

  return {
    sql,
    transform,
  };
};

const sortKeys = {
  displayId: 'patients.display_id',
  lastName: 'UPPER(patients.last_name)',
  culturalName: 'UPPER(patients.cultural_name)',
  firstName: 'UPPER(patients.first_name)',
  age: 'patients.date_of_birth',
  dateOfBirth: 'patients.date_of_birth',
  village_name: 'village_name',
  location: 'location.name',
  department: 'department.name',
  status: 'visits.visit_type',
};

patient.get(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient },
      query,
    } = req;

    req.checkPermission('list', 'Patient');

    const {
      orderBy = 'lastName',
      order = 'asc',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = query;

    const sortKey = sortKeys[orderBy] || sortKeys.displayId;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // query is always going to come in as strings, has to be set manually
    ['ageMax', 'ageMin']
      .filter(k => filterParams[k])
      .map(k => (filterParams[k] = parseFloat(filterParams[k])));

    const filters = [
      makeFilter(filterParams.displayId, `patients.display_id = :displayId`),
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
      makeFilter(filterParams.ageMax, `patients.date_of_birth >= :dobEarliest`, ({ ageMax }) => ({
        dobEarliest: moment()
          .startOf('day')
          .subtract(ageMax + 1, 'years')
          .add(1, 'day')
          .toDate(),
      })),
      makeFilter(filterParams.ageMin, `patients.date_of_birth <= :dobLatest`, ({ ageMin }) => ({
        dobLatest: moment()
          .subtract(ageMin, 'years')
          .endOf('day')
          .toDate(),
      })),
      makeFilter(filterParams.villageId, `patients.village_id = :villageId`),
      makeFilter(filterParams.locationId, `location.id = :locationId`),
      makeFilter(filterParams.departmentId, `department.id = :departmentId`),
      makeFilter(filterParams.inpatient, `visits.visit_type = 'admission'`),
      makeFilter(filterParams.outpatient, `visits.visit_type = 'clinic'`),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const from = `
      FROM patients
        LEFT JOIN visits 
          ON (visits.patient_id = patients.id AND visits.end_date IS NULL)
        LEFT JOIN reference_data AS department
          ON (department.type = 'department' AND department.id = visits.department_id)
        LEFT JOIN reference_data AS location
          ON (location.type = 'location' AND location.id = visits.location_id)
        LEFT JOIN reference_data AS village
          ON (village.type = 'village' AND village.id = patients.village_id)
      ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        filterParams,
      );

    const countResult = await req.db.query(`SELECT COUNT(1) AS count ${from}`, {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    });

    const { count } = countResult[0];

    if (count === 0) {
      // save ourselves a query
      res.send({ data: [], count });
      return;
    }

    const result = await req.db.query(
      `
        SELECT 
          patients.*, 
          visits.visit_type,
          department.id AS department_id,
          department.name AS department_name,
          location.id AS location_id,
          location.name AS location_name,
          village.id AS village_id,
          village.name AS village_name
        ${from}
        
        ORDER BY ${sortKey} ${sortDirection} NULLS LAST
        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        model: Patient,
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    res.send({
      data: result,
      count,
    });
  }),
);
