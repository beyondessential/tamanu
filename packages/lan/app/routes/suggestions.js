import express from 'express';

export const suggestionRoutes = express.Router();

function createSuggestionRoute(path, table, filter, transform = (x) => x) {
  suggestionRoutes.get(`/${path}/:id`, (req, res) => {
    const db = req.app.get('database');
    const { id } = req.params;
    const object = db.objectForPrimaryKey(table, id);
    if(!object) {
      res.status(404).send(`Could not find object with id "${id}" in table "${table}"`);
      return;
    }
    res.send(transform(object));
  });

  suggestionRoutes.get(`/${path}`, (req, res) => {
    const db = req.app.get('database');
    const { q = '', limit = 10 } = req.query;
    const candidates = db
      .objects(table)
      .filtered(filter, q);

    const data = candidates
      .slice(0, limit)
      .map(transform);

    res.send(data);
  });
}

createSuggestionRoute(
  'icd10',
  'diagnosis',
  'name CONTAINS[c] $0 OR code CONTAINS[c] $0',
  ({ name, code, _id }) => ({ name, code, _id })
);
