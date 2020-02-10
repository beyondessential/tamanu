import express from 'express';

import { loginHandler, authMiddleware } from 'lan/app/middleware/auth';
import { constructPermission } from 'lan/app/middleware/permission';

import { user } from './user';
import { patient } from './patient';
import { visit } from './visit';
import { vitals } from './vitals';
import { suggestions } from './suggestions';
import { referenceData } from './referenceData';
import { diagnosis } from './diagnosis';

export const apiv1 = express.Router();

apiv1.post('/login', loginHandler);

apiv1.use(authMiddleware);
apiv1.use(constructPermission);

apiv1.use('/suggestions', suggestions);
apiv1.use('/user', user);
apiv1.use('/patient', patient);
apiv1.use('/visit', visit);
apiv1.use('/vitals', vitals);
apiv1.use('/referenceData', referenceData);
apiv1.use('/diagnosis', diagnosis);
