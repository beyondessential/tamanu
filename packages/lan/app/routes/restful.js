import express from 'express';
import RealmController from '../controllers/realm';

import { encounterRoutes } from './restful/encounter';
import { patientRoutes } from './restful/patient';
import { triageRoutes } from './restful/triage';
import { userRoutes } from './restful/user';
import { programRoutes } from './restful/program';

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
// NB we don't mount as `restfulRoutes.use('/encounter', encounterRoutes);`
// as this would stop that path from being picked up by the generic realm
// controllers below.
restfulRoutes.use(encounterRoutes);
restfulRoutes.use(patientRoutes);
restfulRoutes.use(triageRoutes);
restfulRoutes.use(userRoutes);
restfulRoutes.use(programRoutes);

// generic catch-all routes
restfulRoutes.get('/:model/:id', RealmController.GET);
restfulRoutes.get('/:model', RealmController.GET);
restfulRoutes.patch('/:model/:id', RealmController.PATCH);
restfulRoutes.put('/:model/:id', RealmController.PUT);
restfulRoutes.put('/:model', RealmController.PUT);
restfulRoutes.post('/:model', RealmController.POST);
restfulRoutes.delete('/:model/:id', RealmController.DELETE);
