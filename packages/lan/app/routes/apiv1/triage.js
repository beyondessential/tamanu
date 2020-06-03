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
        *,
        patients.first_name AS first_name,
        patients.last_name AS last_name,
        patients.id AS patient_id
      FROM triages
        LEFT JOIN visits
         ON (visits.id = triages.visit_id)
        LEFT JOIN patients
         ON (visits.patient_id = patients.id)
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
