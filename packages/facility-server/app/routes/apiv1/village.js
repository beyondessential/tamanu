import { REFERENCE_DATA_RELATION_TYPES } from '@tamanu/constants';
import express from 'express';

export const village = express.Router();

village.get('/:id/healthCenter', (req, res) => {
  const {
    models: { ReferenceData, Facility },
    params: { id },
  } = req;
  const village = ReferenceData.findByPk(id);
  const catchment = village.getParent(REFERENCE_DATA_RELATION_TYPES.FACILITY_CATCHMENT);
  const facility = Facility.findOne({ where: { catchmentId: catchment.id } });
  res.send(facility);
});
