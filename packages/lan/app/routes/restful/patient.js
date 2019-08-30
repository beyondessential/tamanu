import express from 'express';
import shortid from 'shortid';

export const patientRoutes = express.Router();

patientRoutes.post('/patient/:id/visits', (req, res) => {
  const db = req.app.get('database');
  const patient = db.objectForPrimaryKey('patient', req.params.id);
  const visit = {
    _id: shortid(),
    ...req.body,
  };

  db.write(() => {
    patient.visits = [...patient.visits, visit];
  });

  res.send(visit);
});

patientRoutes.post('/patient/:id/allergies', (req, res) => {
  throw new Error('Not implemented');
});
