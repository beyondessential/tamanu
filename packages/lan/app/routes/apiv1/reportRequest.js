import express from 'express';
import asyncHandler from 'express-async-handler';

export const reportRequest = express.Router();

reportRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { ReportRequest },
      body,
      user,
    } = req;

    req.checkPermission('create', 'ReportRequest');
    res.send({});
  }),
);
