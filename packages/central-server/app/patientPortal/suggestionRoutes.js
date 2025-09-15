import express from 'express';
import { suggestions } from '@tamanu/shared/services/suggestions';
import { allowListMiddleware } from './allowListMiddleware';
import { REFERENCE_TYPES } from '@tamanu/constants';

export const suggestionRoutes = express.Router();

const allowedSuggesters = [REFERENCE_TYPES.DRUG]

if (Array.isArray(allowedSuggesters) && allowedSuggesters.length > 0) {
  suggestionRoutes.use('/', allowListMiddleware(allowedSuggesters), suggestions);
}
