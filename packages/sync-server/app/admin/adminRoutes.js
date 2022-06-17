import express from 'express';

import { importProgram } from './importProgram';
import { importData } from './importDataDefinition';
import { createDataImporterEndpoint } from './createDataImporterEndpoint';

export const adminRoutes = express.Router();

adminRoutes.use((req, res, next) => {
  // req.checkPermission isn't implemented on sync-server yet
  // req.checkPermission('write', 'User');
  // req.checkPermission('write', 'ReferenceData');
  // req.checkPermission('write', 'Program');
  // req.checkPermission('write', 'Survey');
  next();
});

adminRoutes.post('/importProgram', createDataImporterEndpoint(importProgram));
adminRoutes.post('/importData', createDataImporterEndpoint(importData));
