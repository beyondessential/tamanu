import express from 'express';

import { getPatient } from './patient';

export const patientDataRoutes = express.Router();

patientDataRoutes.get('/', getPatient);
