import express from 'express';
import shortid from 'shortid';

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

addSeedRoute('location');
