import asyncHandler from 'express-async-handler';
import express from 'express';
import { Op } from 'sequelize';

// import { CAN_ACCESS_ALL_FACILITIES } from '@tamanu/constants';

export const facilityRoutes = express.Router();

facilityRoutes.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { store, user } = req;
    const { Facility, User } = store.models;
    const userEntity = await User.findByPk(user.id);

    const allowed = await userEntity.allowedFacilityIds();
    console.log('allowed', allowed);
    const facilities = await Facility.findAll({
      // where: allowed === CAN_ACCESS_ALL_FACILITIES ? {} : { id: { [Op.in]: allowed } },
      // WARNING WARNING UNDO temporary
      where: { name: { [Op.like]: 'Test%' } },
    });

    const data = facilities.map(f => f.forResponse());

    res.send({
      count: facilities.length,
      data,
    });
  }),
);
