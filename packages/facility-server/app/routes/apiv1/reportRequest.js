import express from 'express';
import asyncHandler from 'express-async-handler';
import { REPORT_REQUEST_STATUSES } from '@tamanu/constants';
import { getReportModule } from '@tamanu/shared/reports';
import { createNamedLogger } from '@tamanu/shared/services/logging/createNamedLogger';
import { checkReportModulePermissions } from '@tamanu/shared/reports/utilities/checkReportModulePermissions';
import { NotFoundError } from '@tamanu/shared/errors';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

export const reportRequest = express.Router();

const REPORT_REQUEST_LOG_NAME = 'ReportRequest';

reportRequest.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, body, user, getLocalisation } = req;
    const { ReportRequest, ReportDefinitionVersion } = models;
    const { reportId } = body;
    const reportRequestLog = createNamedLogger(REPORT_REQUEST_LOG_NAME, {
      reportId,
      userId: user.id,
    });

    if (!reportId) {
      throw new NotFoundError('Report id not specified');
    }

    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = await getReportModule(reportId, models);

    if (!reportModule) {
      throw new NotFoundError('Report module not found');
    }
    await checkReportModulePermissions(req, reportModule, reportId);

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
      exportFormat: body.bookType,
    };
    try {
      reportRequestLog.info('Report request creating', {
        recipients: newReportRequest.recipients,
        parameters: newReportRequest.parameters,
      });

      const createdRequest = await ReportRequest.create(newReportRequest);

      reportRequestLog.info('Report request created', {
        recipients: newReportRequest.recipients,
        parameters: newReportRequest.parameters,
      });

      res.send(createdRequest);
    } catch (e) {
      reportRequestLog.error('Report request failed to create', {
        stack: e.stack,
      });
      res.status(400).send({ error: { message: e.message } });
    }
  }),
);
