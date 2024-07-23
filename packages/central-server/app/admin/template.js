import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, ValidationError } from 'sequelize';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
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

  const conflictingRecords = await req.models.Template.count({
    where: { name, id: { [Op.ne]: id ?? null } },
  });

  if (conflictingRecords) {
    throw new ValidationError('Template name must be unique');
  }

  next();
});

templateRoutes.get(
  '/$',
  simpleGetList('Template', null, {
    additionalFilters: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  }),
);
templateRoutes.post('/$', checkUniqueName, simplePost('Template'));
templateRoutes.put('/:id', checkUniqueName, simplePut('Template'));
