import express from 'express';
import { suggestions } from '@tamanu/shared/services/suggestions';
import { REFERENCE_TYPES } from '@tamanu/constants';

export const suggestionRoutes = express.Router();

const allowedSuggesters = [REFERENCE_TYPES.DRUG];
if (Array.isArray(allowedSuggesters) && allowedSuggesters.length > 0) {
  const allowListMiddleware = names => (req, res, next) => {
    const firstSegment = (req.path || '').replace(/^\//, '').split('/')[0];
    if (!names.includes(firstSegment)) {
      res.status(404).end();
      return;
    }
    next();
  };

  suggestionRoutes.use('/', allowListMiddleware(allowedSuggesters), suggestions);
}
