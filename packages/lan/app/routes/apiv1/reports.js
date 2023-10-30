import express from 'express';
import asyncHandler from 'express-async-handler';
import * as reportUtils from '@tamanu/shared/reports';
import { checkReportModulePermissions } from '@tamanu/shared/reports/utilities/checkReportModulePermissions';
import { createNamedLogger } from '@tamanu/shared/services/logging/createNamedLogger';
import { getAvailableReports } from '@tamanu/shared/reports/utilities/getAvailableReports';
import { NotFoundError } from '@tamanu/shared/errors';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

const FACILITY_REPORT_LOG_NAME = 'FacilityReport';

export const reports = express.Router();

reports.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked(); // check happens in getAvailableReports
    const { models, user, ability } = req;
    const availableReports = await getAvailableReports(ability, models, user.id);
    res.send(availableReports);
  }),
);

reports.post(
  '/:reportId',
  asyncHandler(async (req, res) => {
    const {
      body: { parameters = {} },
      user,
      params,
      settings,
      db,
      models,
      reportSchemaStores,
    } = req;
    const { reportId } = params;
    const facilityReportLog = createNamedLogger(FACILITY_REPORT_LOG_NAME, {
      userId: user.id,
      reportId,
    });
    await assertReportEnabled(settings, reportId);

    const reportModule = await reportUtils.getReportModule(reportId, models);

    if (!reportModule) {
      throw new NotFoundError('Report module not found');
    }
    await checkReportModulePermissions(req, reportModule, reportId);

    try {
      facilityReportLog.info('Running report', { parameters });
      const excelData = await reportModule.dataGenerator(
        {
          models,
          reportSchemaStores,
          sequelize: db,
        },
        parameters,
      );
      facilityReportLog.info('Report run successfully');
      res.send(excelData);
    } catch (e) {
      facilityReportLog.error('Report module failed to generate data', {
        stack: e.stack,
      });
      res.status(400).send({
        error: {
          message: e.message,
        },
      });
    }
  }),
);
