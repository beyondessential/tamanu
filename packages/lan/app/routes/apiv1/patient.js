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
  if(!check) return null;

  return {
    sql,
    transform
  };
};

patient.get('/', asyncHandler(async (req, res) => {
  const { models: { Patient }, query } = req;

  req.checkPermission('list', 'Patient');

  const filters = [
    makeFilter(query.displayId, `patients.display_id = :displayId`),
    makeFilter(
      query.firstName, 
      `UPPER(patients.first_name) LIKE UPPER(:firstName)`, 
      ({ firstName }) => ({ firstName: firstName + '%' })
    ),
    makeFilter(
      query.ageMax,
      `patients.date_of_birth >= :dobMax`,
      ({ ageMax }) => ({ dobMax: moment().subtract(ageMax, 'years').subtract(1, 'days').toDate() })
    ),
    makeFilter(
      query.ageMin,
      `patients.date_of_birth <= :dobMin`,
      ({ ageMin }) => ({ dobMin: moment().subtract(ageMin, 'years').add(1, 'days').toDate() })
    ),
    makeFilter(query.villageId, `patients.village_id = :villageId`),
    makeFilter(query.locationId, `location.id = :locationId`),
    makeFilter(query.departmentId, `department.id = :departmentId`),
    makeFilter(query.visitType, `visits.visit_type = :visitType`),
  ].filter(f => f);

  const whereClauses = filters
    .map(f => f.sql)
    .join(' AND ');

  const replacements = filters
    .filter(f => f.transform)
    .reduce((current, { transform }) => ({
      ...current,
      ...transform(current),
    }), query);

  const result = await req.db.query(`
    SELECT 
      patients.*, 
      visits.visit_type,
      department.id AS department_id,
      department.name AS department_name,
      location.id AS location_id,
      location.name AS location_name,
      village.id AS village_id,
      village.name AS village_name
    FROM patients
      LEFT JOIN visits 
        ON (visits.patient_id = patients.id AND visits.end_date IS NULL)
      LEFT JOIN reference_data AS department
        ON (department.type = 'department' AND department.id = visits.department_id)
      LEFT JOIN reference_data AS location
        ON (location.type = 'location' AND location.id = visits.location_id)
      LEFT JOIN reference_data AS village
        ON (village.type = 'village' AND village.id = patients.village_id)
    ${whereClauses && 'WHERE ' + whereClauses}
  `, {
    replacements,
    model: Patient,
    type: QueryTypes.SELECT,
    mapToModel: true,
  });

  res.send({
    results: result,
    total: result.length,
  });
}));

