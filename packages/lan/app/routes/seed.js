import express from 'express';
import shortid from 'shortid';

import { LOCATIONS, PRACTITIONERS, createDummyPatient } from 'Shared/utils';

export const seedRoutes = express.Router();

function addSeedRoute(resource, generateItems) {
  seedRoutes.put(`/${resource}`, (req, res) => {
    const { db, query } = req;
    const { count } = query;
    const items = generateItems(count);

    let recordsWritten = [];
    db.write(() => {
      recordsWritten = items
        .map(item => {
          const newItem = {
            _id: shortid.generate(),
            ...item,
          };
          db.create(resource, newItem);
          return newItem;
        })
        .filter(x => x);
    });

    res.send(recordsWritten);
  });
}

addSeedRoute('location', () => LOCATIONS);
addSeedRoute('practitioner', () => PRACTITIONERS);
addSeedRoute('patient', count => new Array(count).fill(0).map(() => createDummyPatient()));
