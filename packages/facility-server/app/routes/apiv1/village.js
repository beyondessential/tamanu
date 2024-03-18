import { REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import express from 'express';
import { NotFoundError } from '../../../../shared/src/errors';

export const village = express.Router();

village.get('/:id/healthCenter', (req, res) => {
  const {
    models: { ReferenceData, Facility },
    params: { id },
  } = req;
  const catchment = ReferenceData.getParent(id, REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT);
  if (!catchment) throw new NotFoundError();
  const facility = Facility.findOne({ where: { catchmentId: catchment.id } });
  if (!facility) throw new NotFoundError();
  res.send(facility);
});
