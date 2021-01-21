import express from 'express';
import asyncHandler from 'express-async-handler';

export const reportRequest = express.Router();

reportRequest.post('/$', asyncHandler(async(req, res) => {
  const { models: { ReportRequest }, body, user } = req;

  req.checkPermission('create', 'ReportRequest');
  const newReportRequest = {
    reportType: body.reportType,
    recipients: body.emailList.join(','),
    status: 'received',
    requestedByUserId: user.id,
    parameters: JSON.stringify(body.parameters)
  }
  const object = await ReportRequest.create(newReportRequest);
  res.send(object);
}));