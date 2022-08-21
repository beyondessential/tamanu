import express from 'express';
import asyncHandler from 'express-async-handler';
import { getReportModule, REPORT_DEFINITIONS, REPORT_OBJECTS } from 'shared/reports';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

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
    const availableReports = REPORT_DEFINITIONS.filter(
      ({ id }) => !disabledReports.includes(id) && ability.can('run', REPORT_OBJECTS[id]),
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
      const options = JSON.parse(version.queryOptions);
      const { parameters } = options;
      return {
        id: version.id,
        name: r.name,
        dateRangeLabel: 'DATE RANGE LABEL',
        legacyReport: false,
        parameters,
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
      params,
      getLocalisation,
    } = req;
    const { reportId } = params;

    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportId);

    const reportModule = await getReportModule(reportId, models);

    if (!reportModule) {
      res.status(400).send({ message: 'invalid reportId' });
      return;
    }
    req.checkPermission('read', reportModule.permission);

    const excelData = await reportModule.dataGenerator({ sequelize: db, models }, parameters);
    res.send(excelData);
  }),
);
