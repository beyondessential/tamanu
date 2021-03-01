import express from 'express';

export const suggestionRoutes = express.Router();

const defaultTransform = ({ name, _id }) => ({ name, _id });

function createSuggestionRoute(
  path,
  table,
  filter,
  transform = defaultTransform,
  sortKey = 'name',
) {
  suggestionRoutes.get(`/${path}/:id`, (req, res) => {
    const { db, params } = req;
    const { id } = params;
    const object = db.objectForPrimaryKey(table, id);
    if (!object) {
      res.status(404).send(`Could not find object with id "${id}" in table "${table}"`);
      return;
    }
    res.send(transform(object));
  });

  suggestionRoutes.get(`/${path}`, (req, res) => {
    const { db, query } = req;
    const { q = '', limit = 10 } = query;
    const candidates = db
      .objects(table)
      .filtered(filter, q)
      .sorted(sortKey);

    const data = candidates.slice(0, limit).map(transform);

    res.send(data);
  });
}

// eslint-disable-next-line no-unused-vars
function createDummySuggestionRoute(path, valuesTemplate) {
  const makeId = s =>
    s
      .trim()
      .replace(/\s/g, '-')
      .replace(/[^\w-]/g, '')
      .toLowerCase();
  const split = s =>
    s
      .split(/[\r\n]+/g)
      .map(x => x.trim())
      .filter(x => x);
  const values = split(valuesTemplate).map(s => ({ name: s, _id: makeId(s) }));
  suggestionRoutes.get(`/${path}/:id`, (req, res) => {
    const { id } = req.params;
    const object = values.find(x => x._id === id);
    if (!object) {
      res.status(404).send(`Could not find object with id "${id}" (dummy model)`);
      return;
    }
    res.send(object);
  });

  suggestionRoutes.get(`/${path}`, (req, res) => {
    const { q = '', limit = 10 } = req.query;
    const query = q.toLowerCase();
    const data = values.filter(x => x.name.toLowerCase().includes(query)).slice(0, limit);

    res.send(data);
  });
}

createSuggestionRoute(
  'icd10',
  'diagnosis',
  '(name CONTAINS[c] $0 OR code BEGINSWITH[c] $0) AND type = "icd10"',
  ({ name, code, _id }) => ({ name, code, _id }),
);

createSuggestionRoute(
  'triageComplaint',
  'diagnosis',
  '(name CONTAINS[c] $0 OR code BEGINSWITH[c] $0) AND type = "triage"',
  ({ name, code, _id }) => ({ name, code, _id }),
);

createSuggestionRoute(
  'procedure',
  'procedureType',
  '(name BEGINSWITH[c] $0 OR code BEGINSWITH[c] $0)',
  ({ name, code, _id }) => ({ name, code, _id }),
);

createSuggestionRoute('allergy', 'allergy', '(name CONTAINS[c] $0)', ({ name, _id }) => ({
  name,
  _id,
}));

createSuggestionRoute('practitioner', 'user', 'name CONTAINS[c] $0');

createSuggestionRoute(
  'patient',
  'patient',
  'firstName CONTAINS[c] $0 OR lastName CONTAINS[c] $0',
  ({ _id, firstName, lastName }) => ({ _id, firstName, lastName }),
  'lastName',
);

createSuggestionRoute('facility', 'facility', 'name CONTAINS[c] $0');
createSuggestionRoute('location', 'location', 'name CONTAINS[c] $0');
createSuggestionRoute('drug', 'drug', 'name BEGINSWITH[c] $0');
createSuggestionRoute('department', 'department', 'name CONTAINS[c] $0');
createSuggestionRoute('village', 'village', 'name CONTAINS[c] $0');

createSuggestionRoute(
  'carePlan',
  'carePlan',
  '(name CONTAINS[c] $0 OR code BEGINSWITH[c] $0) AND type = "carePlan"',
  ({ name, code, _id }) => ({ name, code, _id }),
);