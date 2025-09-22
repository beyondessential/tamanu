import express from 'express';
import { suggestions } from '@tamanu/shared/services/suggestions/index';
import { REFERENCE_TYPES } from '@tamanu/constants';

const SUGGESTER_ALLOW_LIST = [REFERENCE_TYPES.DRUG];

export const suggestionRoutes = express.Router();

const allowListMiddleware = names => (req, res, next) => {
  const firstSegment = (req.path || '').replace(/^\//, '').split('/')[0];
  if (!names.includes(firstSegment)) {
    res.status(404).end();
    return;
  }
  next();
};

suggestionRoutes.use('/', allowListMiddleware(SUGGESTER_ALLOW_LIST), suggestions);
