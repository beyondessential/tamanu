import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, ValidationError } from 'sequelize';

import { VISIBILITY_STATUSES } from 'shared/constants';
import { simpleGetList, simplePost, simplePut } from 'shared/utils/crudHelpers';

export const patientLetterTemplateRoutes = express.Router();

const checkUniqueName = asyncHandler(async (req, res, next) => {
  const { name, id } = req.body;
  const conflictingRecords = await req.models.PatientLetterTemplate.count({
    where: { name, id: { [Op.ne]: id } },
  });
  
  if(conflictingRecords){
    throw new ValidationError('Template name must be unique');
  }

  next();
});

patientLetterTemplateRoutes.get('/$', simpleGetList('PatientLetterTemplate', null, { additionalFilters: { visibilityStatus: VISIBILITY_STATUSES.CURRENT }}));
patientLetterTemplateRoutes.post('/$', checkUniqueName, simplePost('PatientLetterTemplate'));
patientLetterTemplateRoutes.post('/$', checkUniqueName, simplePut('PatientLetterTemplate'));
