import express from 'express';
import asyncHandler from 'express-async-handler';
import * as reportUtils from 'shared/reports';
import { checkReportModulePermissions } from 'shared/reports/utilities/checkReportModulePermissions';
import { createNamedLogger } from 'shared/services/logging/createNamedLogger';
import { getAvailableReports } from 'shared/reports/utilities/getAvailableReports';
import { NotFoundError } from 'shared/errors';
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
      db,
      getLocalisation,
      models,
      reports: reportInstances,
    } = req;
    const { reportId } = params;
    const facilityReportLog = createNamedLogger(FACILITY_REPORT_LOG_NAME, {
      userId: user.id,
      reportId,
    });
    const localisation = await getLocalisation();

    assertReportEnabled(localisation, reportId);

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
          reports: reportInstances,
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
