import express from 'express';
import shortid from 'shortid';
import { objectToJSON } from '../utils';

export const adminRoutes = express.Router();

function updateObject(base, patch) {
  // ignore any keys that aren't in base as they aren't in the schema
  const flattenedObject = objectToJSON(base);
  const updates = Object.entries(flattenedObject).map(([key, value]) => {
    const updatedValue = patch[key];
    if (base[key] && updatedValue && updatedValue._id === base[key]._id) {
      // unchanged foreign key
      return false;
    }
    if (patch.hasOwnProperty(key) && value !== updatedValue) {
      // eslint-disable-next-line no-param-reassign
      base[key] = updatedValue;
      return true;
    }
    return false;
  });

  // return true iff any keys were updated
  if (updates.some(x => x)) {
    return base; // now with updated fields
  }
  return null;
}

function addOrUpdateMany(db, table, items, findExisting, defaultValues = {}) {
  const objects = db.objects(table);

  let recordsWritten = [];
  db.write(() => {
    recordsWritten = items
      .map(item => {
        const existing = findExisting(objects, item);

        if (existing) {
          return updateObject(existing, { ...defaultValues, ...item });
        }

        const newItem = {
          _id: shortid(),
          ...defaultValues,
          ...item,
        };
        db.create(table, newItem);
        return newItem;
      })
      .filter(x => x);
  });
  return recordsWritten;
}

adminRoutes.put('/diagnoses', (req, res) => {
  const db = req.app.get('database');
  const items = req.body;

  const recordsWritten = addOrUpdateMany(
    db,
    'diagnosis',
    items,
    (objects, item) => objects.filtered('code = $0', item.code)[0],
    { type: 'icd10' },
  );

  res.send(recordsWritten);
});
