import express from 'express';
import asyncHandler from 'express-async-handler';
import { getReportModule, REPORT_DEFINITIONS, REPORT_OBJECTS } from 'shared/reports';
import { assertReportEnabled } from '../../utils/assertReportEnabled';
import { renameObjectKeys } from '../../utils/renameObjectKeys';
import { QueryTypes } from 'sequelize';

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

const reportColumnTemplate = [
  {
    title: 'Patient First Name',
    accessor: referral => referral.initiatingEncounter.patient.firstName,
  },
  {
    title: 'Patient Last Name',
    accessor: referral => referral.initiatingEncounter.patient.lastName,
  },
  {
    title: 'National Health Number',
    accessor: referral => referral.initiatingEncounter.patient.displayId,
  },
  {
    title: 'Diagnoses',
    accessor: referral => {
      if (referral.initiatingEncounter.diagnoses && referral.initiatingEncounter.diagnoses.length) {
        return referral.initiatingEncounter.diagnoses
          .map(d => {
            if (d.Diagnosis && d.Diagnosis.name) {
              return d.Diagnosis.name;
            }
            return '';
          })
          .join(', ');
      }

      return undefined;
    },
  },
  {
    title: 'Referring Doctor',
    accessor: referral => referral.initiatingEncounter.examiner.displayName,
  },
  {
    title: 'Department',
    accessor: referral => referral.initiatingEncounter.referredToDepartment?.name || '',
  },
  { title: 'Date', accessor: referral => referral.initiatingEncounter.startDate },
];

const generateReportFromQueryData = queryData => [
  Object.keys(queryData[0]),
  ...queryData.map(col => Object.values(col)),
];

reports.post(
  '/:reportId',
  asyncHandler(async (req, res) => {
    const {
      db,
      models,
      body: { parameters },
      query,
      params,
      getLocalisation,
    } = req;
    const { reportId } = params;
    const legacyReport = JSON.parse(query.legacyReport);

    if (legacyReport) {
      const localisation = await getLocalisation();
      assertReportEnabled(localisation, reportId);

      const reportModule = getReportModule(reportId);
      if (!reportModule) {
        res.status(400).send({ message: 'invalid reportId' });
        return;
      }
      req.checkPermission('read', reportModule.permission);

      const excelData = await reportModule.dataGenerator({ sequelize: db, models }, parameters);
      res.send(excelData);
    } else {
      req.checkPermission('read', 'Report');
      const reportDefinition = await models.ReportDefinitionVersion.findByPk(reportId);

      const reportQuery = reportDefinition.get('query');

      const queryResults = await req.db.query(reportQuery, {
        type: QueryTypes.SELECT,
        replacements: parameters,
      });

      const forResponse = generateReportFromQueryData(queryResults, reportColumnTemplate);

      res.send(forResponse);
    }
  }),
);
