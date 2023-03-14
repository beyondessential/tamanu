import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';

export const certificateNotification = express.Router();

certificateNotification.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    req.checkPermission('create', 'CertificateNotification');
    const object = await models.CertificateNotification.create({
      ...req.body,
      facilityId: config.serverFacilityId,
    });
    res.send(object);
  }),
);
