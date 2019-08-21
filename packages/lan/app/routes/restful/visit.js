import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

export const visitRoutes = express.Router();

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

visitRoutes.post('/visit/:id/discharge', (req, res) => {
  const db = req.app.get('database');
  const visit = db.objectForPrimaryKey('visit', req.params.id);

  // TODO: validate

  // TODO: send discharge prescription to pharmacy via msupply

  db.write(() => {
    Object.assign(visit, req.body);
  });

  res.send(objectToJSON(visit));
});
