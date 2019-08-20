import express from 'express';
import RealmController from '../controllers/realm';

import shortid from 'shortid';

export const restfulRoutes = express.Router();
restfulRoutes.get('/:model/search', (req, res, next) => { req.params.fuzzy = true; next(); }, RealmController.GET);
restfulRoutes.get('/:model/:id', RealmController.GET);
restfulRoutes.get('/:model', RealmController.GET);
restfulRoutes.patch('/:model/:id', RealmController.PATCH);
restfulRoutes.put('/:model/:id', RealmController.PUT);
restfulRoutes.put('/:model', RealmController.PUT);
restfulRoutes.post('/:model', RealmController.POST);
restfulRoutes.delete('/:model/:id', RealmController.DELETE);



restfulRoutes.post('/patient/:id/visits', (req, res) => {
  const db = req.app.get('database');
  const patient = db.objectForPrimaryKey('patient', req.params.id);
  const visit = {
    _id: shortid(),
    ...req.body,
  };

  db.write(() => {
    patient.visits = [...patient.visits, visit];
  });

  res.send(visit);
});
