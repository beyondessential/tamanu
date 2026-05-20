import express from 'express';
import { encounterSummaryRoute } from './encounterSummaryRoute';

export const encounterAiRoute = express.Router();

encounterAiRoute.use('/summary', encounterSummaryRoute);
