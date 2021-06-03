import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';

import { importSurvey } from '../../admin/surveyImporter';
import { importData } from '../../admin/importDataDefinition';
import { createDataImporterEndpoint } from '../../admin/createDataImporterEndpoint';

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
  // let everything through
  req.flagPermissionChecked();
  next();
});
//*****************************

adminRoutes.post('/importSurvey', createDataImporterEndpoint(importSurvey));
adminRoutes.post('/importData', createDataImporterEndpoint(importData));
