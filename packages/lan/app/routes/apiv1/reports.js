import express from 'express';
import { getReportModule } from 'shared/reports';
import asyncHandler from 'express-async-handler';
import { log } from 'shared/services/logging';
import { getSyncServerConfig } from '../../sync/util';

export const reports = express.Router();

reports.post(
  '/:reportType',
  asyncHandler(async (req, res) => {
    const reportModule = getReportModule(req.params.reportType);
    if (!reportModule) {
      res.status(500).send({});
      return;
    }
    req.checkPermission('read', reportModule.permission);

    const {
      models,
      body: { parameters },
    } = req;

    let otherConfig = {};
    try {
      otherConfig = await getSyncServerConfig();
    } catch (e) {
      log.warn(
        `Failed to connect to sync server to fetch config when generating report ${req.params.reportType}`,
      );
    }

    const excelData = await reportModule.dataGenerator(models, parameters, otherConfig);
    res.send(excelData);
  }),
);
