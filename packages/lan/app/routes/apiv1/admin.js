import express from 'express';

import { createDataImporterEndpoint } from '../../admin/createDataImporterEndpoint';

import { importProgram } from '../../admin/importProgram';
import { importData } from '../../admin/importDataDefinition';
import { importPermissions } from '../../admin/importPermissions';

export const admin = express.Router();

admin.use((req, res, next) => {
  req.checkPermission('write', 'User');
  req.checkPermission('write', 'Role');
  req.checkPermission('write', 'Permission');
  req.checkPermission('write', 'ReferenceData');
  req.checkPermission('write', 'Program');
  req.checkPermission('write', 'Survey');
  next();
});

admin.post('/importProgram', createDataImporterEndpoint(importProgram));
admin.post('/importData', createDataImporterEndpoint(importData));
admin.post('/importPermissions', createDataImporterEndpoint(importPermissions));
