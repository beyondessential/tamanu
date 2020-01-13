import express from 'express';
import asyncHandler from 'express-async-handler';

import { user } from './user';

export const apiv1 = express.Router();

apiv1.use('/user', user);

