import express from 'express';

import { authModule } from './auth';
import { patientDataRoutes } from './patientData/patientDataRoutes';

export const patientPortalModule = express.Router();

patientPortalModule.use(authModule);

patientPortalModule.use('/me', patientDataRoutes);
