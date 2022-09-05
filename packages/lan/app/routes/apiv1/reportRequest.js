import express from 'express';
import asyncHandler from 'express-async-handler';
import { createNamedLogger } from 'shared-src/src/utils/reportLog';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

export const reportRequest = express.Router();

const REPORT_REQUEST_LOG_NAME = 'ReportRequest';

const reportRequestLog = createNamedLogger(REPORT_REQUEST_LOG_NAME);

reportRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, user, getLocalisation } = req;
    const { ReportRequest, ReportDefinitionVersion } = models;
    const { reportId } = body;

    req.checkPermission('create', 'ReportRequest');
    if (!reportId) {
      const message = 'Report id not specifed';
      reportRequestLog.error(message, reportId, user.id);
      res.status(400).send({ error: { message } });
      return;
    }

    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = await getReportModule(reportId, models);

    if (!reportModule) {
      const message = 'Report module not found';
      reportRequestLog.error(message, reportId, user.id);
      res.status(400).send({ error: { message } });
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
    try {
      reportRequestLog.info('Report request creating', reportId, user.id, {
        recipients: newReportRequest.recipients,
        parameters: newReportRequest.parameters,
      });

      const createdRequest = await ReportRequest.create(newReportRequest);

      reportRequestLog.info('Report request created', reportId, user.id, {
        recipients: newReportRequest.recipients,
        parameters: newReportRequest.parameters,
      });

      res.send(createdRequest);
    } catch (e) {
      reportRequestLog.error('Report request failed to create', reportId, user.id, {
        stack: e.stack,
      });
      res.status(400).send({ error: { message: e.message } });
    }
  }),
);
