import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

export const visitRoutes = express.Router();

visitRoutes.post('/visit/:id/note', (req, res) => {
  const { db } = req;
  const visit = db.objectForPrimaryKey('visit', req.params.id);
  const note = {
    _id: shortid.generate(),
    ...req.body,
  };

  // TODO: validate
  console.log(JSON.stringify(note));

  db.write(() => {
    visit.notes = [...visit.notes, note];
  });

  res.send(objectToJSON(note));
});

visitRoutes.post('/visit/:id/diagnosis', (req, res) => {
  const { db } = req;
  const visit = db.objectForPrimaryKey('visit', req.params.id);
  const diagnosis = {
    _id: shortid.generate(),
    ...req.body,
  };

  // TODO: validate

  db.write(() => {
    visit.diagnoses = [...visit.diagnoses, diagnosis];
  });

  res.send(objectToJSON(diagnosis));
});

visitRoutes.post('/visit/:id/labRequest', (req, res) => {
  const { db } = req;
  const visit = db.objectForPrimaryKey('visit', req.params.id);
  const request = {
    _id: shortid.generate(),
    ...req.body,
  };

  // TODO: validate

  // create tests for each testType given
  request.tests = request.testTypes.map(({ _id: typeId }) => ({
    _id: shortid.generate(),
    type: { _id: typeId },
  }));

  db.write(() => {
    visit.labRequests = [...visit.labRequests, request];
  });

  res.send(objectToJSON(request));
});

visitRoutes.post('/visit/:id/vitals', (req, res) => {
  const { db } = req;
  const visit = db.objectForPrimaryKey('visit', req.params.id);
  const reading = {
    _id: shortid.generate(),
    ...req.body,
  };

  // TODO: validate

  db.write(() => {
    visit.vitals = [...visit.vitals, reading];
  });

  res.send(objectToJSON(reading));
});

visitRoutes.post('/visit/:id/medications', (req, res) => {
  const { db } = req;
  const visit = db.objectForPrimaryKey('visit', req.params.id);
  const medication = {
    _id: shortid.generate(),
    ...req.body,
  };

  // TODO: validate

  db.write(() => {
    visit.medications = [...visit.medications, medication];
  });

  res.send(objectToJSON(medication));
});
