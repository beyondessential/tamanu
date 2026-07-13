import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { EditConflictError } from '@tamanu/errors';
import { simpleGetList, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const templateRoutes = express.Router();

const checkUniqueName = asyncHandler(async (req, res, next) => {
  req.checkPermission('list', 'Template');
  const { id: paramId } = req.params;
  const { name, id = paramId } = req.body;

  // If we're not trying to change the name, no check needed
  if (!name) {
    next();
    return;
  }

  // When you “delete” a template via Admin Panel, it actually just sets the `visibility_status` to
  // ‘historical’. Enforce uniqueness amongst non-“deleted” templates.
  const conflictingRecord = await req.models.Template.findOne({
    where: {
      name,
      id: { [Op.ne]: id ?? null },
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
    attributes: ['id'], // Arbitrary projection, just checking existence
  });

  if (conflictingRecord) {
    throw new EditConflictError('Template name must be unique');
  }

  next();
});

templateRoutes.get(
  '/',
  simpleGetList('Template', null, {
    additionalFilters: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  }),
);
templateRoutes.post('/', checkUniqueName, simplePost('Template'));
templateRoutes.put('/:id', checkUniqueName, simplePut('Template'));
