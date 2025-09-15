import express from 'express';
import config from 'config';
import { suggestions } from '@tamanu/shared/services/suggestions';
import { allowListMiddleware } from './allowListMiddleware';

export const suggestionRoutes = express.Router();

const allowedSuggesters = config.patientPortal.allowedSuggesters;

if (Array.isArray(allowedSuggesters) && allowedSuggesters.length > 0) {
  suggestionRoutes.use('/', allowListMiddleware(allowedSuggesters), suggestions);
}
