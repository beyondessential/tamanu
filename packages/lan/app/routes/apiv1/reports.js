import express from 'express';
import asyncHandler from 'express-async-handler';
import { getReportModule, REPORT_DEFINITIONS } from 'shared/reports';
import { assertReportEnabled } from '../../utils/assertReportEnabled';

export const reports = express.Router();

reports.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.flagPermissionChecked();
    const { models, user } = req;
    const localisation = await models.UserLocalisationCache.getLocalisation({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
    });

    const disabledReports = localisation?.disabledReports || [];
    const availableReports = REPORT_DEFINITIONS.filter(r => !disabledReports.includes(r.id));
    res.send(availableReports);
  }),
);

reports.post(
  '/:reportType',
  asyncHandler(async (req, res) => {
    const {
      models,
      body: { parameters },
      getLocalisation,
    } = req;
    const { reportType } = req.params;

    const localisation = await getLocalisation();
    assertReportEnabled(localisation, reportType);

    const reportModule = getReportModule(req.params.reportType);
    if (!reportModule) {
      res.status(500).send({});
      return;
    }
    req.checkPermission('read', reportModule.permission);

    const excelData = await reportModule.dataGenerator(models, parameters);
    res.send(excelData);
  }),
);
