import express from 'express';
import { suggestions } from '@tamanu/shared/services/suggestions';
import { allowListMiddleware } from './allowListMiddleware';
import { REFERENCE_TYPES } from '@tamanu/constants';

const SUGGESTER_ALLOW_LIST = [REFERENCE_TYPES.DRUG];

export const suggestionRoutes = express.Router();

suggestionRoutes.use('/', allowListMiddleware(SUGGESTER_ALLOW_LIST), suggestions);
