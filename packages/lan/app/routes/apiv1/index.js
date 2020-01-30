import express from 'express';

import { loginHandler, authMiddleware } from 'lan/app/controllers/auth/middleware';
import { checkPermission } from 'lan/app/controllers/auth/permission';

import { user } from './user';
import { patient } from './patient';
import { visit } from './visit';
import { vitals } from './vitals';
import { suggestions } from './suggestions';

export const apiv1 = express.Router();

apiv1.post('/login', checkPermission(null), loginHandler);
apiv1.use('/suggestions', suggestions);

apiv1.use(authMiddleware);

apiv1.use('/user', user);
apiv1.use('/patient', patient);
apiv1.use('/visit', visit);
apiv1.use('/vitals', vitals);
