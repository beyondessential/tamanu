import express from 'express';
import { encounterSummaryRoute } from './encounterSummary';

export const encounterRoute = express.Router();

encounterRoute.use('/summary', encounterSummaryRoute);
