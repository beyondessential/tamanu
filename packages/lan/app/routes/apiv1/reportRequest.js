import express from 'express';
import asyncHandler from 'express-async-handler';
import { REPORT_REQUEST_STATUSES } from 'shared/constants';
import { getReportModule } from 'shared/reports';
import { log } from 'shared/services/logging/log';
import { assertReportEnabled } from '../../utils/assertReportEnabled';
import { logReportError, REPORT_TYPES } from './reports';

export const reportRequest = express.Router();

reportRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, user, getLocalisation } = req;
    const { ReportRequest, ReportDefinitionVersion } = models;
    const { reportId } = body;

    req.checkPermission('create', 'ReportRequest');
    if (!reportId) {
      logReportError(REPORT_TYPES.ALL, 'Report id not specified', user.id);
      res.status(400).send({ error: { message: 'reportId missing' } });
      return;
    }

    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = await getReportModule(reportId, models);

    if (!reportModule) {
      log.error(REPORT_TYPES.ALL, 'Report module not found', user.id, reportId);
      res.status(400).send({ error: { message: 'invalid reportId' } });
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
      const createdRequest = await ReportRequest.create(newReportRequest);
      res.send(createdRequest);
    } catch (err) {
      log.error(REPORT_TYPES.ALL, 'Report request failed to create', user.id, err);
      res.status(400).send({ error: { message: err.message } });
    }
  }),
);
