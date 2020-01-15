import express from 'express';

import { user } from './user';
import { patient } from './patient';

export const apiv1 = express.Router();

apiv1.use('/user', user);
apiv1.use('/patient', patient);
