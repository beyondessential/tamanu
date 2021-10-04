import express from 'express';

import { simpleGet } from './crudHelpers';

export const department = express.Router();

department.get('/:id', simpleGet('Department'));
