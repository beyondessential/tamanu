import asyncHandler from 'express-async-handler';
import { generateRecentDiagnosesReport } from 'shared/reports';

export const createRecentDiagnosesReport = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'EncounterDiagnosis');
  const {
    models,
    body: { parameters },
  } = req;

  if (!parameters.diagnosis) {
    res.status(400).send(`'diagnosis' parameter is required`);
    return;
  }
  const excelData = await generateRecentDiagnosesReport(models, parameters);
  res.send(excelData);
});
