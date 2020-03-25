import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const patient = express.Router();

patient.get('/:id', simpleGet('Patient'));
patient.put('/:id', simplePut('Patient'));
patient.post('/$', simplePost('Patient'));

patient.get('/:id/visits', simpleGetList('Visit', 'patientId'));

const makeFilter = (check, sql) => {
  if(!check) return null;

  return sql;
};

patient.get('/', asyncHandler(async (req, res) => {
  const { models: { Patient }, query } = req;

  req.checkPermission('list', 'Patient');

  const filters = [
    makeFilter(query.displayId, `patients.display_id = :displayId`),
    makeFilter(query.firstName, `patients.first_name = :firstName`),
    makeFilter(query.ageMax, `patients.date_of_birth <= :ageMax`),
    makeFilter(query.ageMin, `patients.date_of_birth >= :ageMin`),
    makeFilter(query.villageName, `village.name = :villageName`),
    makeFilter(query.visitType, `visits.visit_type = :visitType`),
  ].filter(x => x);

  if(filters.length === 0) {
    // no active filters - just return everybody
    
    const { rows, count } = await Patient.findAndCountAll();
    
    res.send({
      results: rows,
      total: count,
    });

    return;
  }

  const whereClauses = filters
    .join(' AND ');

  const result = await req.db.query(`
    SELECT 
      patients.*, 
      visits.visit_type,
      village.name AS village_name
    FROM patients
      LEFT JOIN visits 
        ON (visits.patient_id = visits.id AND visits.end_date IS NULL)
      LEFT JOIN reference_data AS department
        ON (department.type = 'department' AND department.id = visits.department_id)
      LEFT JOIN reference_data AS location
        ON (location.type = 'location' AND location.id = visits.location_id)
      LEFT JOIN reference_data AS village
        ON (village.type = 'village' AND village.id = patients.village_id)
    WHERE
      ${whereClauses}
  `, {
    replacements: query,
    model: Patient,
    type: QueryTypes.SELECT,
    mapToModel: true,
  });

  res.send({
    results: result,
    total: result.length,
  });
}));

