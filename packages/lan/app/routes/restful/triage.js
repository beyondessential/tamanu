import express from 'express';
import shortid from 'shortid';

import { objectToJSON } from '../../utils';

export const triageRoutes = express.Router();

const TRIAGE_OBJECT_DEPTH = 3;

triageRoutes.get('/triage', (req, res) => {
  const db = req.app.get('database');

  const triages = db.objects('triage')
    .sorted([
      ['visit.visitType', true],
      'score',
      'triageTime',
    ])

  const data = triages.map(item => objectToJSON(item, TRIAGE_OBJECT_DEPTH));

  res.send({
    count: data.length,
    data
  });
});

