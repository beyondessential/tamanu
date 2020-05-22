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
  '/',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient },
      query,
    } = req;

    const {
      rowsPerPage = 10,
      page = 0,
    } = query;

    // query is always going to come in as strings, has to be set manually
    ['ageMax', 'ageMin'].filter(k => query[k]).map(k => (query[k] = parseFloat(query[k])));

    req.checkPermission('list', 'Patient');

    const filters = [
      makeFilter(query.displayId, `patients.display_id = :displayId`),
      makeFilter(
        query.firstName,
        `UPPER(patients.first_name) LIKE UPPER(:firstName)`,
        ({ firstName }) => ({ firstName: `${firstName}%` }),
      ),
      makeFilter(
        query.lastName,
        `UPPER(patients.last_name) LIKE UPPER(:lastName)`,
        ({ lastName }) => ({ lastName: `${lastName}%` }),
      ),
      makeFilter(
        query.culturalName,
        `UPPER(patients.cultural_name) LIKE UPPER(:culturalName)`,
        ({ culturalName }) => ({ culturalName: `${culturalName}%` }),
      ),
      makeFilter(query.ageMax, `patients.date_of_birth >= :dobEarliest`, ({ ageMax }) => ({
        dobEarliest: moment()
          .startOf('day')
          .subtract(ageMax + 1, 'years')
          .add(1, 'day')
          .toDate(),
      })),
      makeFilter(query.ageMin, `patients.date_of_birth <= :dobLatest`, ({ ageMin }) => ({
        dobLatest: moment()
          .subtract(ageMin, 'years')
          .endOf('day')
          .toDate(),
      })),
      makeFilter(query.villageId, `patients.village_id = :villageId`),
      makeFilter(query.locationId, `location.id = :locationId`),
      makeFilter(query.departmentId, `department.id = :departmentId`),
      makeFilter(query.visitType, `visits.visit_type = :visitType`),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        query,
      );

    const { 
      orderBy,
      order = 'asc'
    } = query;

    const sortKey = sortKeys[orderBy] || sortKeys.displayId;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

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

    const countResult = await req.db.query(`SELECT COUNT(1) AS count ${from}`, {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    });

    const { count } = countResult[0];

    if(count === 0) {
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
