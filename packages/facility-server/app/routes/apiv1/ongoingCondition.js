import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/errors';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const ongoingCondition = express.Router();

ongoingCondition.get('/:id', simpleGet('PatientCondition', { auditAccess: true }));
ongoingCondition.put('/:id', simplePut('PatientCondition'));
ongoingCondition.post('/$', simplePost('PatientCondition'));

ongoingCondition.delete('/:id', asyncHandler(async (req, res) => {
  const { models, params } = req;
  req.checkPermission('delete', 'PatientCondition');
  
  const condition = await models.PatientCondition.findByPk(params.id);
  if (!condition) {
    throw new NotFoundError('Ongoing condition not found');
  }

  await condition.destroy();
  
  res.status(200).send({ message: 'Ongoing condition deleted successfully' });
}));
