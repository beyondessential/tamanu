import express from 'express';
import asyncHandler from 'express-async-handler';
import * as reportUtils from 'shared/reports';
import { canRunStaticReport } from 'shared/reports/utilities/canRunStaticReport';
import { createNamedLogger } from 'shared/services/logging/createNamedLogger';
import { getAvailableReports } from 'shared/reports/utilities/getAvailableReports';
import { ForbiddenError } from 'shared/errors';
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
      db,
      models,
      body: { parameters = {} },
      user,
      params,
      getLocalisation,
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
      req.flagPermissionChecked(); // need to do this, even on errors
      const message = 'Report module not found';
      facilityReportLog.error(message);
      res.status(400).send({ error: { message } });
      return;
    }

    if (reportModule.getReportDefinition) {
      // for db-defined reports, check permission for specific report
      const definition = await reportModule.getReportDefinition();
      req.checkPermission('run', definition);
    } else {
      // for static reports, check EITHER defined permission OR explicit run permission
      if (!canRunStaticReport(req.ability, reportId, reportModule.permission)) {
        throw new ForbiddenError('User does not have permission to run the report');
      }
      req.flagPermissionChecked(); // flag because we're checking for either of two permissions
    }

    try {
      facilityReportLog.info('Running report', { parameters });
      const excelData = await reportModule.dataGenerator({ sequelize: db, models }, parameters);
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
