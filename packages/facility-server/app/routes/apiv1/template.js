import express from 'express';

import { simpleGet } from '@tamanu/shared/utils/crudHelpers';

export const template = express.Router();

template.get('/:id', simpleGet('Template'));
