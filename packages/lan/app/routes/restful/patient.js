import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

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
  const db = req.app.get('database');
  const patient = db.objectForPrimaryKey('patient', req.params.id);
  const allergy = {
    _id: shortid(),
    ...req.body,
  };

  db.write(() => {
    patient.allergies = [...patient.allergies, allergy];
  });

  res.send(allergy);
});

patientRoutes.post('/patient/:id/referral', (req, res) => {
  const db = req.app.get('database');
  const patient = db.objectForPrimaryKey('patient', req.params.id);
  const referral = {
    _id: shortid(),
    ...req.body,
  };

  // TODO: validate

  db.write(() => {
    patient.referrals = [...patient.referrals, referral];
  });

  res.send(objectToJSON(referral));
});
