import express from 'express';

export const quicksearchRoutes = express.Router();

quicksearchRoutes.get('/icd10', (req, res) => {
  const db = req.app.get('database');
  const { query } = req;
  const { q = '' } = query;
  const candidates = db.objects('diagnosis')
    .filtered(`name CONTAINS[c] $0 OR code CONTAINS[c] $0`, q);
  
  const data = candidates.slice(0, 10)
    .map(({ name, code, _id }) => ({ name, code, _id }));

  res.send(data);
});

