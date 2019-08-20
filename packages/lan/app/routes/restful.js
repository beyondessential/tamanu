import express from 'express';
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

// specific handlers for different models
// NB we don't mount as `restfulRoutes.use('/visit', visitRoutes);`
// as this would stop that path from being picked up by the generic realm
// controllers below.
restfulRoutes.use(visitRoutes);

// generic catch-all routes
restfulRoutes.get('/:model/:id', RealmController.GET);
restfulRoutes.get('/:model', RealmController.GET);
restfulRoutes.patch('/:model/:id', RealmController.PATCH);
restfulRoutes.put('/:model/:id', RealmController.PUT);
restfulRoutes.put('/:model', RealmController.PUT);
restfulRoutes.post('/:model', RealmController.POST);
restfulRoutes.delete('/:model/:id', RealmController.DELETE);
