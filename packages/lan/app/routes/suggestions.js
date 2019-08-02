import express from 'express';

export const suggestionRoutes = express.Router();

const defaultTransform = ({ name, _id }) => ({ name, _id });

function createSuggestionRoute(path, table, filter, transform = defaultTransform) {
  suggestionRoutes.get(`/${path}/:id`, (req, res) => {
    const db = req.app.get('database');
    const { id } = req.params;
    const object = db.objectForPrimaryKey(table, id);
    if (!object) {
      res.status(404).send(`Could not find object with id "${id}" in table "${table}"`);
      return;
    }
    res.send(transform(object));
  });

  suggestionRoutes.get(`/${path}`, (req, res) => {
    const db = req.app.get('database');
    const { q = '', limit = 10 } = req.query;
    const candidates = db.objects(table).filtered(filter, q);

    const data = candidates.slice(0, limit).map(transform);

    res.send(data);
  });
}

function createDummySuggestionRoute(path, values) {
  suggestionRoutes.get(`/${path}/:id`, (req, res) => {
    const db = req.app.get('database');
    const { id } = req.params;
    const object = values.find(x => x._id === id);
    if (!object) {
      res.status(404).send(`Could not find object with id "${id}" in table "${table}"`);
      return;
    }
    res.send(object);
  });

  suggestionRoutes.get(`/${path}`, (req, res) => {
    const db = req.app.get('database');
    const { q = '', limit = 10 } = req.query;
    const query = q.toLowerCase();
    const data = values.filter(x => x.name.toLowerCase().includes(query)).slice(0, limit);

    res.send(data);
  });
}

createSuggestionRoute(
  'icd10',
  'diagnosis',
  'name CONTAINS[c] $0 OR code CONTAINS[c] $0',
  ({ name, code, _id }) => ({ name, code, _id }),
);

createSuggestionRoute('practitioner', 'user', 'name CONTAINS[c] $0');

createDummySuggestionRoute('location', [
  { name: 'Ward 1', _id: 'ward1' },
  { name: 'Ward 2', _id: 'ward2' },
  { name: 'Ward 3', _id: 'ward3' },
  { name: 'Emergency', _id: 'emergency' },
  { name: 'Radiology', _id: 'radiology' },
]);
