import express from 'express';

import { authModule } from './auth';

export const patientPortalModule = express.Router();

patientPortalModule.use(authModule);
