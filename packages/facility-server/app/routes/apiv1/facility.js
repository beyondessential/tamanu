import express from 'express';

import { simpleGet } from '@tamanu/shared/utils/crudHelpers';

export const facility = express.Router();

facility.get('/:id', simpleGet('Facility'));
