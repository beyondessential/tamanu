import asyncHandler from 'express-async-handler';
import { generateIncompleteReferralsReport } from 'shared/reports';

export const createIncompleteReferralsReport = asyncHandler(async (req, res) => {
  req.checkPermission('read', 'Referral');
  const {
    models,
    body: { parameters },
  } = req;

  const excelData = await generateIncompleteReferralsReport(models, parameters);
  res.send(excelData);
});
