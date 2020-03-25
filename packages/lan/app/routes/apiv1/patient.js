import express from 'express';
import asyncHandler from 'express-async-handler';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const patient = express.Router();

patient.get('/:id', simpleGet('Patient'));
patient.put('/:id', simplePut('Patient'));
patient.post('/$', simplePost('Patient'));

patient.get('/:id/visits', simpleGetList('Visit', 'patientId'));

patient.get('/', asyncHandler(async (req, res) => {
  const { models: { Patient }, query } = req;

  req.checkPermission('list', 'Patient');

  const { rows, count } = await Patient.findAndCountAll({
    where: query,
  });
  
  res.send({
    results: rows,
    total: count,
  });
}));

