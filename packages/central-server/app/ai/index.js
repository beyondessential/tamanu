import express from 'express';
import { patientAiRoute } from './patient';
import { encounterAiRoute } from './encounter';

export const aiRoutes = express.Router();

aiRoutes.use('/patient', patientAiRoute);
aiRoutes.use('/encounter', encounterAiRoute);
