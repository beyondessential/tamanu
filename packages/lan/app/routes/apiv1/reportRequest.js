import express from 'express';
import asyncHandler from 'express-async-handler';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

export const reportRequest = express.Router();

reportRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, user, getLocalisation } = req;
    const { ReportRequest, ReportDefinitionVersion } = models;
    const { reportId } = body;

    req.checkPermission('create', 'ReportRequest');
    if (!reportId) {
      res.status(400).send({ message: 'reportId missing' });
      return;
    }

    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = await getReportModule(reportId, models);

    if (!reportModule) {
      res.status(400).send({ message: 'invalid reportId' });
      return;
    }

    req.checkPermission('read', reportModule.permission);

    const isDatabaseDefinedReport = reportModule instanceof ReportDefinitionVersion;

    const newReportRequest = {
      ...(isDatabaseDefinedReport
        ? { reportDefinitionVersionId: reportId }
        : { reportType: reportId }),
      recipients: JSON.stringify({
        email: body.emailList,
      }),
      status: REPORT_REQUEST_STATUSES.RECEIVED,
      requestedByUserId: user.id,
      parameters: JSON.stringify(body.parameters),
    };

    const createdRequest = await ReportRequest.create(newReportRequest);
    res.send(createdRequest);
  }),
);
