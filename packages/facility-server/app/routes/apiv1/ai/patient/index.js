import express from 'express';
import { patientSummaryRoute } from './patientSummary';

export const patientRoute = express.Router();

patientRoute.use('/summary', patientSummaryRoute);
