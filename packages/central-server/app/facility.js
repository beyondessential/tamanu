import { CAN_ACCESS_ALL_FACILITIES } from '@tamanu/constants';
import express from 'express';
import asyncHandler from 'express-async-handler';

export const facilityRoutes = express.Router();

facilityRoutes.get(
  '/$',
  asyncHandler(async (req, res) => {
    const user = await req.store.models.User.findByPk(req.user.id)
    const allowed = await user.allowedFacilityIds();
    const facilities = await req.store.models.Facility.findAll({
      where: allowed === CAN_ACCESS_ALL_FACILITIES ? {} : { id: allowed },
    });

    const data = facilities.map(f => f.forResponse());

    res.send({
      count: facilities.length,
      data,
    });
  }),
);
