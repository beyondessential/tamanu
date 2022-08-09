import express from 'express';
import asyncHandler from 'express-async-handler';

export const facilityRoutes = express.Router();

facilityRoutes.get(
    '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'facility');

    const { query } = req;
    const facilities = await req.store.models.Facility.findAll();

    const data = facilities.map(f => f.forResponse());

    res.send({
      count: facilities.length,
      data,
    });
  }),
);
