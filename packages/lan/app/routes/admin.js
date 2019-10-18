import express from 'express';
import shortid from 'shortid';
import { objectToJSON } from '../utils';

export const adminRoutes = express.Router();

function updateObject(base, patch) {
  // ignore any keys that aren't in base as they aren't in the schema
  const flattenedObject = objectToJSON(base);
  const updates = Object.entries(flattenedObject).map(([key, value]) => {
    const updatedValue = patch[key];
    if (
      base[key] &&
      base[key].hasOwnProperty('_id') &&
      updatedValue &&
      updatedValue._id === base[key]._id
    ) {
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

  // return the new object iff any keys were updated
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
          _id: shortid.generate(),
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

function addAdminRoute(resource, uniqueFieldName, defaultValue) {
  adminRoutes.put(`/${resource}`, (req, res) => {
    const { db, body } = req;
    const items = body;

    const findExisting = (objects, item) =>
      item[uniqueFieldName]
        ? objects.filtered(`${uniqueFieldName} = $0`, item[uniqueFieldName])[0]
        : null;
    const recordsWritten = addOrUpdateMany(db, resource, items, findExisting, defaultValue);

    res.send(recordsWritten);
  });
}

addAdminRoute('diagnosis', 'code', { type: 'icd10' });

// labTestType is a bit more custom
adminRoutes.put('/labTestType', (req, res) => {
  const { db, body } = req;
  const items = body;

  // create/update categories
  const categories = db.objects('labTestCategory');
  const categorisedItems = items.map(testType => {
    const { category } = testType;
    const existing = categories.filtered('_id = $0 OR name = $1', category._id, category.name)[0];
    if (existing) {
      return { ...testType, category: existing };
    }
    const newCategory = { _id: shortid.generate(), ...category };
    db.write(() => {
      const created = db.create('labTestCategory', newCategory);
      category._id = created._id;
    });
    return { ...testType, category: newCategory };
  });

  const recordsWritten = addOrUpdateMany(
    db,
    'labTestType',
    categorisedItems,
    (objects, item) => objects.filtered('_id = $0 OR name = $1', item._id, item.name)[0],
  );

  res.send(recordsWritten);
});
