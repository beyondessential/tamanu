import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { importSurvey } from '../../admin/importProgram';
import { importData } from '../../admin/importDataDefinition';

const adminRoutes = express.Router();

//****************************
// TODO: implement permission checks on admin
// hide these routes behind a debug-only config flag until 
// permission checks are done
//
const { allowAdminRoutes } = config.admin;
export const admin = allowAdminRoutes 
  ? adminRoutes 
  // use a null middleware if admin routes are disabled 
  : (req, res, next) => next();

adminRoutes.use((req, res, next) => {
  req.flagPermissionChecked();
  next();
});
//*****************************

adminRoutes.post('/importSurvey', asyncHandler(async (req, res) => {
  const { 
    file,
    programName,
    programCode,
    surveyName,
    surveyCode,
    dryRun,
  } = req.body;

  console.log(programName, req.body);

  await importSurvey({
    file,
    programCode,
    programName,
    surveyCode,
    surveyName,
    dryRun,
  });

  res.send({ success: true });
}));

adminRoutes.post('/importData', asyncHandler(async (req, res) => {
  const { 
    file,
    dryRun,
  } = req.body;

  importData({ file, dryRun });

  res.send({ success: true });
}));
