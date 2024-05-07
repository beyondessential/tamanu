import express from 'express';
import asyncHandler from 'express-async-handler';

export const facilityRoutes = express.Router();

facilityRoutes.get(
  '/$',
  asyncHandler(async (req, res) => {
    const allowed = await req.user.allowedFacilityIds();
    const facilities = await req.store.models.Facility.findAll({
      where: { id: allowed },
    });

    const data = facilities.map(f => f.forResponse());

    res.send({
      count: facilities.length,
      data,
    });
  }),
);
