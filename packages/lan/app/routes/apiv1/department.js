import express from 'express';

import { simpleGet } from 'shared/utils/crudHelpers';

export const department = express.Router();

department.get('/:id', simpleGet('Department'));
