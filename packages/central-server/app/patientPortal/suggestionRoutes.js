import express from 'express';
import { suggestions } from '@tamanu/shared/services/suggestions';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { allowListMiddleware } from './allowListMiddleware';

export const suggestionRoutes = express.Router();

const allowedSuggesters = [REFERENCE_TYPES.DRUG];

if (Array.isArray(allowedSuggesters) && allowedSuggesters.length > 0) {
  suggestionRoutes.use('/', allowListMiddleware(allowedSuggesters), suggestions);
}
