import express from 'express';
import asyncHandler from 'express-async-handler';
import * as reportUtils from 'shared/reports';
import { log } from 'shared/services/logging/log';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

const FACILITY_REPORT_LOG_NAME = 'FacilityReport';

export const reportLogWithContext = (severity, name) => (message, reportId, userId, data = {}) =>
  log[severity](`${name} - ${message}`, {
    name,
    reportId,
    userId,
    ...data,
  });

const reportLog = {
  error: reportLogWithContext('error', FACILITY_REPORT_LOG_NAME),
  info: reportLogWithContext('info', FACILITY_REPORT_LOG_NAME),
};

export const reports = express.Router();

reports.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { models, user, ability } = req;
    const { UserLocalisationCache, ReportDefinition } = models;

    const localisation = await UserLocalisationCache.getLocalisation({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
    });

    const disabledReports = localisation?.disabledReports || [];
    const availableReports = reportUtils.REPORT_DEFINITIONS.filter(
      ({ id }) =>
        !disabledReports.includes(id) && ability.can('run', reportUtils.REPORT_OBJECTS[id]),
    ).map(report => ({ ...report, legacyReport: true }));

    const reportsDefinitions = await ReportDefinition.findAll({
      include: [
        {
          model: models.ReportDefinitionVersion,
          as: 'versions',
          where: { status: 'published' },
        },
      ],
      order: [['versions', 'version_number', 'DESC']],
    });

    const dbReports = reportsDefinitions.map(r => {
      // Get the latest report definition version by getting the first record from the ordered list
      const version = r.versions[0];

      return {
        id: version.id,
        name: r.name,
        dateRangeLabel: 'Date range (or leave blank for all data)',
        parameters: version.getParameters(),
        version: version.versionNumber,
      };
    });

    res.send([...availableReports, ...dbReports]);
  }),
);

reports.post(
  '/:reportId',
  asyncHandler(async (req, res) => {
    const {
      db,
      models,
      body: { parameters },
      user,
      params,
      getLocalisation,
    } = req;
    // Permissions are checked per report module
    req.flagPermissionChecked();
    const { reportId } = params;
    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = await reportUtils.getReportModule(reportId, models);

    if (!reportModule) {
      const message = 'Report module not found';
      reportLog.error(message, reportId, user.id);
      res.status(400).send({ error: { message } });
      return;
    }

    req.checkPermission('read', reportModule.permission);

    try {
      reportLog.info('Running report', reportId, user.id, { parameters });
      const excelData = await reportModule.dataGenerator({ sequelize: db, models }, parameters);
      reportLog.info('Report run successfully', reportId, user.id, { excelData });
      res.send(excelData);
    } catch (e) {
      reportLog.error('Report module failed to generate data', reportId, user.id, {
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
