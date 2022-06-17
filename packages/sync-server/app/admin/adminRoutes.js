import express from 'express';

import { importData } from './importDataDefinition';
import { importPermissions } from './importPermissions';
import { importProgram } from './importProgram';
import { createDataImporterEndpoint } from './createDataImporterEndpoint';

export const adminRoutes = express.Router();

admin.use((req, res, next) => {
  req.checkPermission('write', 'User');
  req.checkPermission('write', 'Role');
  req.checkPermission('write', 'Permission');
  req.checkPermission('write', 'ReferenceData');
  req.checkPermission('write', 'Program');
  req.checkPermission('write', 'Survey');
  next();
});

adminRoutes.post('/importData', createDataImporterEndpoint(importData));
adminRoutes.post('/importPermissions', createDataImporterEndpoint(importPermissions));
adminRoutes.post('/importProgram', createDataImporterEndpoint(importProgram));
