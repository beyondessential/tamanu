import express from 'express';
import asyncHandler from 'express-async-handler';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

export const reportRequest = express.Router();

reportRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { ReportRequest },
      body,
      user,
      getLocalisation,
      query,
    } = req;

    console.log('endpoint...');

    const legacyReport = JSON.parse(query.legacyReport);
    const { reportId } = body;

    req.checkPermission('create', 'ReportRequest');
    if (!reportId) {
      res.status(400).send({ message: 'reportId missing' });
      return;
    }

    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = getReportModule(reportId);
    // Todo: add validation for database defined reports
    if (!reportModule && legacyReport) {
      res.status(400).send({ message: 'invalid reportId' });
      return;
    }

    // Todo: Permission check for db defined reports
    if (legacyReport) {
      req.checkPermission('read', reportModule.permission);
    }

    const newReportRequest = {
      reportType: legacyReport ? reportId : undefined,
      versionId: legacyReport ? undefined : reportId,
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
