import express from 'express';

import { objectToJSON } from '../../utils';

export const triageRoutes = express.Router();

const TRIAGE_OBJECT_DEPTH = 3;

triageRoutes.get('/triage', (req, res) => {
  const { db } = req;

  const triages = db
    .objects('triage')
    .filtered('encounter.encounterType == "triage" or encounter.encounterType == "observation"')
    .filtered('encounter.endDate == null')
    .sorted([['encounter.encounterType', true], 'score', 'triageTime']);

  const data = triages.map(item => objectToJSON(item, TRIAGE_OBJECT_DEPTH));

  res.send({
    count: data.length,
    data,
  });
});
