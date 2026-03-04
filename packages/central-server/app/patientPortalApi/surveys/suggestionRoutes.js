import express from 'express';
import { suggestions } from '@tamanu/shared/services/suggestions/index';
import { PORTAL_SUGGESTER_ALLOW_LIST } from '@tamanu/constants';

export const suggestionRoutes = express.Router();

export const allowListMiddleware = names => (req, res, next) => {
  const firstSegment = (req.path || '').replace(/^\//, '').split('/')[0];
  if (!names.includes(firstSegment)) {
    res.status(404).end();
    return;
  }
  next();
};

suggestionRoutes.use('/', allowListMiddleware(PORTAL_SUGGESTER_ALLOW_LIST), suggestions);
