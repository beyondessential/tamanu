import express from 'express';
import { patientSummaryRoute } from './patientSummaryRoute';

export const patientAiRoute = express.Router();

patientAiRoute.use('/summary', patientSummaryRoute);
