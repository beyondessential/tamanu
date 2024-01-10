import express from 'express';

import { simpleGet } from '@tamanu/shared/utils/crudHelpers';

export const department = express.Router();

department.get('/:id', simpleGet('Department'));
