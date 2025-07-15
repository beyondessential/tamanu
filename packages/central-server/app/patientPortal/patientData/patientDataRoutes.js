import express from 'express';

import { getPatientAllergies } from './allergies';
import { getPatient } from './patient';
import { getOngoingConditions } from './ongoingConditions';

export const patientDataRoutes = express.Router();

patientDataRoutes.get('/', getPatient);

patientDataRoutes.get('/ongoing-conditions', getOngoingConditions);

patientDataRoutes.get('/allergies', getPatientAllergies);
