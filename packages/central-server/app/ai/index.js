import express from 'express';
import { patientAiRoute } from './patient';

export const aiRoutes = express.Router();

aiRoutes.use('/patient', patientAiRoute);
