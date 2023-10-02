import express from 'express';
import { simpleGet } from '@tamanu/shared/utils/crudHelpers';

export const programRegistry = express.Router();

programRegistry.get('/:id', simpleGet('ProgramRegistry'));
