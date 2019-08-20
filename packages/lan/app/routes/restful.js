import express from 'express';
import shortid from 'shortid';
import RealmController from '../controllers/realm';

import { visitRoutes } from './restful/visit';

export const restfulRoutes = express.Router();
restfulRoutes.get(
  '/:model/search',
  (req, res, next) => {
    req.params.fuzzy = true;
    next();
  },
  RealmController.GET,
);
restfulRoutes.get('/:model/:id', RealmController.GET);
restfulRoutes.get('/:model', RealmController.GET);
restfulRoutes.patch('/:model/:id', RealmController.PATCH);
restfulRoutes.put('/:model/:id', RealmController.PUT);
restfulRoutes.put('/:model', RealmController.PUT);
restfulRoutes.post('/:model', RealmController.POST);
restfulRoutes.delete('/:model/:id', RealmController.DELETE);

restfulRoutes.use(visitRoutes);
