import express from 'express';
import { getReportModule, REPORT_OPTION_TYPES } from 'shared/reports';
import { ForbiddenError } from 'shared/errors';
import asyncHandler from 'express-async-handler';

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
    const availableReports = REPORT_OPTION_TYPES.filter(r => !disabledReports.includes(r.id));
    res.send(availableReports);
  }),
);

reports.post(
  '/:reportType',
  asyncHandler(async (req, res) => {
    const {
      models,
      user,
      body: { parameters },
    } = req;
    const { reportType } = req.params;
    const localisation = await models.UserLocalisationCache.getLocalisation({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
    });

    const disabledReports = localisation?.disabledReports || [];

    if (disabledReports.includes(reportType)) {
      throw new ForbiddenError(`Report "${reportType}" is disabled`);
    }

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
