import express from 'express';

import { user } from './user';
import { patient } from './patient';
import { visit } from './visit';
import { vitals } from './vitals';

export const apiv1 = express.Router();

apiv1.use('/user', user);
apiv1.use('/patient', patient);
apiv1.use('/visit', visit);
apiv1.use('/vitals', vitals);
