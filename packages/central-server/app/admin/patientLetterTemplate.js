import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, ValidationError } from 'sequelize';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { simpleGetList, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const patientLetterTemplateRoutes = express.Router();

const checkUniqueName = asyncHandler(async (req, res, next) => {
  req.checkPermission('list', 'PatientLetterTemplate');
  const { id: paramId } = req.params;
  const { name, id = paramId } = req.body;

  // If we're not trying to change the name, no check needed
  if (!name) {
    next();
    return;
  }

  const conflictingRecords = await req.models.PatientLetterTemplate.count({
    where: { name, id: { [Op.ne]: id ?? null } },
  });

  if (conflictingRecords) {
    throw new ValidationError('Template name must be unique');
  }

  next();
});

patientLetterTemplateRoutes.get(
  '/$',
  simpleGetList('PatientLetterTemplate', null, {
    additionalFilters: { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
  }),
);
patientLetterTemplateRoutes.post('/$', checkUniqueName, simplePost('PatientLetterTemplate'));
patientLetterTemplateRoutes.put('/:id', checkUniqueName, simplePut('PatientLetterTemplate'));
