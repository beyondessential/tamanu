import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const triage = express.Router();

triage.get('/:id', simpleGet('Triage'));
triage.put('/:id', simplePut('Triage'));
triage.post('/$', simplePost('Triage'));

triage.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { Triage } = models;

    req.checkPermission('list', 'Triage');

    const result = await req.db.query(`
      SELECT
        triages.*,
        visits.*,
        visits.id as visit_id,
        patients.*,
        patients.id AS patient_id,
        location.name AS location_name,
        complaint.name AS chief_complaint
      FROM triages
        LEFT JOIN visits
         ON (visits.id = triages.visit_id)
        LEFT JOIN patients
         ON (visits.patient_id = patients.id)
        LEFT JOIN reference_data AS location
         ON (visits.location_id = location.id)
        LEFT JOIN reference_data AS complaint
         ON (triages.chief_complaint_id = complaint.id)
    `, {
      model: Triage,
      type: QueryTypes.SELECT,
      mapToModel: true,
    });

    res.send({ 
      data: result,
      count: result.length,
    });
  })
);
