import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import moment from 'moment';

import {
  simpleGet,
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
} from './crudHelpers';

import { renameObjectKeys } from '~/utils/renameObjectKeys';

export const patient = express.Router();

patient.get('/:id', simpleGet('Patient'));
patient.put('/:id', simplePut('Patient'));
patient.post('/$', simplePost('Patient'));

const patientRelations = permissionCheckingRouter('read', 'Patient');

patientRelations.get('/:id/encounters', simpleGetList('Encounter', 'patientId'));

// TODO
// patientRelations.get('/:id/referrals', simpleGetList('Referral', 'patientId'));
// patientRelations.get('/:id/appointments', simpleGetList('Appointment', 'patientId'));

patientRelations.get('/:id/issues', simpleGetList('PatientIssue', 'patientId'));
patientRelations.get('/:id/conditions', simpleGetList('PatientCondition', 'patientId'));
patientRelations.get('/:id/allergies', simpleGetList('PatientAllergy', 'patientId'));
patientRelations.get('/:id/familyHistory', simpleGetList('PatientFamilyHistory', 'patientId'));

patient.use(patientRelations);

patient.get(
  '/:id/currentEncounter',
  asyncHandler(async (req, res) => {
    const {
      models: { Encounter },
      params,
    } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'Encounter');

    const currentEncounter = await Encounter.findOne({
      where: {
        patientId: params.id,
        endDate: null,
      },
      include: Encounter.getFullReferenceAssociations(),
    });

    // explicitly send as json (as it might be null)
    res.json(currentEncounter);
  }),
);

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
  villageName: 'village_name',
  locationName: 'location.name',
  departmentName: 'department.name',
  encounterType: 'encounters.encounter_type',
  sex: 'patients.sex',
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
      makeFilter(filterParams.inpatient, `encounters.encounter_type = 'admission'`),
      makeFilter(filterParams.outpatient, `encounters.encounter_type = 'clinic'`),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const from = `
      FROM patients
        LEFT JOIN encounters 
          ON (encounters.patient_id = patients.id AND encounters.end_date IS NULL)
        LEFT JOIN reference_data AS department
          ON (department.type = 'department' AND department.id = encounters.department_id)
        LEFT JOIN reference_data AS location
          ON (location.type = 'location' AND location.id = encounters.location_id)
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
          encounters.id AS encounter_id,
          encounters.encounter_type,
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

    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));

    res.send({
      data: forResponse,
      count,
    });
  }),
);
