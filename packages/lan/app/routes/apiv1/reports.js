import express from 'express';
import { getReportModule } from 'shared/reports';
import asyncHandler from 'express-async-handler';

export const reports = express.Router();

reports.post(
  '/:reportType',
  asyncHandler(async (req, res) => {
    const reportModule = getReportModule(req.params.reportType);
    if (!reportModule) {
      res.status(400).send({ message: 'invalid reportType' });
      return;
    }
    req.checkPermission('read', reportModule.permission);

    const {
      models,
      body: { parameters },
    } = req;
    const excelData = await reportModule.dataGenerator(models, parameters);
    res.send(excelData);
  }),
);
