import shortid from 'shortid';

import {
  ALLERGIES,
  createDummyPatient,
  DEPARTMENTS,
  DIAGNOSES,
  DRUGS,
  FACILITIES,
  IMAGING_TYPES,
  generateLabTestTypes,
  LOCATIONS,
  USERS,
  PROCEDURE_TYPES,
  VILLAGES,
} from 'Shared/demoData';

const GENERATORS = {
  allergy: () => ALLERGIES,
  department: () => DEPARTMENTS,
  diagnosis: () => DIAGNOSES,
  drug: () => DRUGS,
  procedureType: () => PROCEDURE_TYPES,
  facility: () => FACILITIES,
  imagingType: () => IMAGING_TYPES,
  labTestType: generateLabTestTypes,
  location: () => LOCATIONS,
  patient: (db, count) => new Array(count).fill(0).map(() => createDummyPatient(db)),
  user: () => USERS,
  village: () => VILLAGES,
};

const generateAndWrite = (db, resource, count) => {
  let recordsWritten;
  db.write(() => {
    const items = GENERATORS[resource](db, count);
    recordsWritten = items
      .map(({ _id, ...restOfItem }) => {
        if (db.objects(resource).filtered('_id = $0', _id).length > 0) {
          return null; // no need to re-seed this, as it already exists in the db
        }
        const newItem = {
          _id: _id || shortid.generate(),
          ...restOfItem,
        };
        db.create(resource, newItem);
        return newItem;
      })
      .filter(x => x);
  });
  return recordsWritten;
};

const SPECIAL_PLURALS = { diagnoses: 'diagnosis' };
const singularise = plural =>
  SPECIAL_PLURALS[plural] || plural.replace(/(s)$/, '').replace(/(ie)$/, 'y');

export const seed = (req, res) => {
  const { db, body } = req;
  const recordsWritten = Object.entries(body)
    .filter(([key, shouldSeed]) => !!shouldSeed)
    .map(([key, count]) => {
      const resource = singularise(key.replace(/(Count)$/, ''));
      return generateAndWrite(db, resource, count);
    });

  res.send(recordsWritten);
};
