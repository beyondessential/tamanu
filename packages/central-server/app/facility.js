import { CAN_ACCESS_ALL_FACILITIES } from '@tamanu/constants';
import express from 'express';
import asyncHandler from 'express-async-handler';

export const facilityRoutes = express.Router();

facilityRoutes.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { store, user } = req;
    const { User, Facility } = store.models;
    const userEntity = await User.findByPk(user.id);
    const allowed = await userEntity.allowedFacilityIds();
    const facilities = await Facility.findAll({
      where: allowed === CAN_ACCESS_ALL_FACILITIES ? {} : { id: allowed },
    });

    const data = facilities.map(f => f.forResponse());

    res.send({
      count: facilities.length,
      data,
    });
  }),
);
