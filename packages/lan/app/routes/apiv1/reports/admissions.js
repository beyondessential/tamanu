import asyncHandler from 'express-async-handler';
import { generateAdmissionsReport } from 'shared/reports';

export const createAdmissionsReport = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'Encounter');
  const {
    models,
    body: { parameters },
  } = req;
  const excelData = await generateAdmissionsReport(models, parameters);
  res.send(excelData);
});
