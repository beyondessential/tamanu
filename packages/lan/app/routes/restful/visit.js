import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

export const visitRoutes = express.Router();

visitRoutes.post('/visit/:id/diagnosis', (req, res) => {
  const db = req.app.get('database');
  const visit = db.objectForPrimaryKey('visit', req.params.id);
  const diagnosis = {
    _id: shortid(),
    ...req.body,
  };

  // TODO: validate

  db.write(() => {
    visit.diagnoses = [...visit.diagnoses, diagnosis];
  });

  res.send(objectToJSON(diagnosis));
});

visitRoutes.post('/visit/:id/vitals', (req, res) => {
  const db = req.app.get('database');
  const visit = db.objectForPrimaryKey('visit', req.params.id);
  const reading = {
    _id: shortid(),
    ...req.body,
  };

  // TODO: validate

  db.write(() => {
    visit.vitals = [...visit.vitals, reading];
  });

  res.send(objectToJSON(reading));
});
