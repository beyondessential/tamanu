import express from 'express';

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

  res.send(visit);
});
