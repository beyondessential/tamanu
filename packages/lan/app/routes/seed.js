import shortid from 'shortid';

import { LOCATIONS, PRACTITIONERS, createDummyPatient } from 'Shared/utils';

const GENERATORS = {
  location: () => LOCATIONS,
  practitioner: () => PRACTITIONERS,
  patient: count => new Array(count).fill(0).map(() => createDummyPatient()),
};

const RESOURCE_TO_RECORD_TYPE = {
  practitioner: 'user',
};

const generateAndWrite = (db, resource, count) => {
  const items = GENERATORS[resource](count);
  let recordsWritten = [];
  db.write(() => {
    recordsWritten = items
      .map(({ _id, ...restOfItem }) => {
        const recordType = RESOURCE_TO_RECORD_TYPE[resource] || resource;
        if (db.objects(recordType).filtered('_id = $0', _id).length > 0) {
          return null; // no need to re-seed this, as it already exists in the db
        }
        const newItem = {
          _id: _id || shortid.generate(),
          ...restOfItem,
        };
        db.create(recordType, newItem);
        return newItem;
      })
      .filter(x => x);
  });
  return recordsWritten;
};

export const seed = (req, res) => {
  const { db, body } = req;
  const recordsWritten = Object.entries(body)
    .filter(([key, shouldSeed]) => !!shouldSeed)
    .map(([key, count]) => {
      const resource = key.replace(/(s|(Count))$/, '');
      return generateAndWrite(db, resource, count);
    });

  res.send(recordsWritten);
};
