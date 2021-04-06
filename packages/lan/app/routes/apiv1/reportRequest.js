import express from 'express';
import asyncHandler from 'express-async-handler';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';

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
    if (!body.reportType) {
      res.status(400).send({ message: 'reportType missing' });
      return;
    }
    const reportModule = getReportModule(body.reportType);
    if(!reportModule) {
      res.status(400).send({ message: 'invalid reportType' });
      return;
    }
    req.checkPermission('read', reportModule.permission);

    const newReportRequest = {
      reportType: body.reportType,
      recipients: body.emailList.join(','),
      status: REPORT_REQUEST_STATUSES.RECEIVED,
      requestedByUserId: user.id,
      parameters: JSON.stringify(body.parameters),
    };
    const createdRequest = await ReportRequest.create(newReportRequest);
    res.send(createdRequest);
  }),
);
