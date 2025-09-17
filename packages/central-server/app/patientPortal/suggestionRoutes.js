import express from 'express';
import { suggestions } from '@tamanu/shared/services/suggestions';
import { allowListMiddleware } from './allowListMiddleware';
import { PORTAL_SUGGESTER_ALLOW_LIST } from '@tamanu/constants';

export const suggestionRoutes = express.Router();

suggestionRoutes.use('/', allowListMiddleware(PORTAL_SUGGESTER_ALLOW_LIST), suggestions);
