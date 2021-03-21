import asyncHandler from 'express-async-handler';
import { generateAefiReport } from '../../../../../shared-src/src/reports/aefi';

export const createAefiReport = asyncHandler(async (req, res) => {
  req.checkPermission('list', 'Survey');
  const {
    models,
    body: { parameters },
  } = req;

  const excelData = await generateAefiReport(models, parameters);
  res.send(excelData);
});
