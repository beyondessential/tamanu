import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError } from '@tamanu/shared/errors';

export const facility = express.Router();

facility.get('/:id', asyncHandler(async (req, res) => {
  // No permission check needed - users should be able to read all facilities
  req.flagPermissionChecked();
  
  const { models, params } = req;
  const object = await models.Facility.findByPk(params.id, {
    include: models.Facility.getFullReferenceAssociations ? models.Facility.getFullReferenceAssociations() : [],
  });
  
  if (!object) throw new NotFoundError();
  
  res.send(object);
}));
