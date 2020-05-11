import express from 'express';

import { loginHandler, authMiddleware } from '../../middleware/auth';
import { constructPermission } from '../../middleware/permission';

import { user } from './user';
import { patient } from './patient';
import { visit } from './visit';
import { vitals } from './vitals';
import { suggestions } from './suggestions';
import { triage } from './triage';
import { referenceData } from './referenceData';
import { diagnosis } from './diagnosis';
import { note } from './note';
import { labRequest, labTest } from './labs';

export const apiv1 = express.Router();

apiv1.post('/login', loginHandler);

apiv1.use(authMiddleware);
apiv1.use(constructPermission);

apiv1.use('/suggestions', suggestions);
apiv1.use('/user', user);
apiv1.use('/patient', patient);
apiv1.use('/visit', visit);
apiv1.use('/vitals', vitals);
apiv1.use('/triage', triage);
apiv1.use('/referenceData', referenceData);
apiv1.use('/diagnosis', diagnosis);
apiv1.use('/note', note);
apiv1.use('/labRequest', labRequest);
apiv1.use('/labTest', labTest);
