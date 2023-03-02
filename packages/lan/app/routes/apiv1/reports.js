import express from 'express';
import asyncHandler from 'express-async-handler';
import * as reportUtils from 'shared/reports';
import { REPORT_STATUSES, REPORT_DATE_RANGE_LABELS } from 'shared/constants';
import { createNamedLogger } from 'shared/services/logging/createNamedLogger';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

const FACILITY_REPORT_LOG_NAME = 'FacilityReport';

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
          where: { status: REPORT_STATUSES.PUBLISHED },
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
        dataSourceOptions: version.queryOptions.dataSources,
        filterDateRangeAsStrings: true,
        dateRangeLabel:
          version.queryOptions.dateRangeLabel ||
          REPORT_DATE_RANGE_LABELS[version.queryOptions.defaultDateRange],
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
    const facilityReportLog = createNamedLogger(FACILITY_REPORT_LOG_NAME, {
      userId: user.id,
      reportId,
    });
    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = await reportUtils.getReportModule(reportId, models);

    if (!reportModule) {
      const message = 'Report module not found';
      facilityReportLog.error(message);
      res.status(400).send({ error: { message } });
      return;
    }

    req.checkPermission('read', reportModule.permission);

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
