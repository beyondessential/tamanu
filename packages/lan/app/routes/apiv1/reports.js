import express from 'express';
import { ReportTypeMapper } from 'shared/reports';
import asyncHandler from 'express-async-handler';

export const reports = express.Router();

reports.post(
  '/:reportType',
  asyncHandler(async (req, res) => {
    const reportTypeHandler = ReportTypeMapper[req.params.reportType];
    if (!reportTypeHandler) {
      res.status(500).send({});
      return;
    }
    req.checkPermission('read', reportTypeHandler.permission);
    const {
      models,
      body: { parameters },
    } = req;
    const excelData = await reportTypeHandler.dataGenerator(models, parameters);
    res.send(excelData);
  }),
);
