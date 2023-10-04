import express from 'express';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { simpleGet, simpleGetList } from '@tamanu/shared/utils/crudHelpers';

export const programRegistry = express.Router();

programRegistry.get('/:id', simpleGet('ProgramRegistry'));
programRegistry.get(
  '/$',
  simpleGetList('ProgramRegistry', '', {
    additionalFilters: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  }),
);
