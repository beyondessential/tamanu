import express from 'express';
import config from 'config';

import { importProgram } from '~/admin/importProgram';
import { importData } from '../../admin/importDataDefinition';
import { createDataImporterEndpoint } from '../../admin/createDataImporterEndpoint';

export const admin = express.Router();

admin.use((req, res, next) => {
  req.checkPermission('write', 'User');
  req.checkPermission('write', 'ReferenceData');
  req.checkPermission('write', 'Program');
  req.checkPermission('write', 'Survey');
  next();
});

admin.post('/importProgram', createDataImporterEndpoint(importProgram));
admin.post('/importData', createDataImporterEndpoint(importData));
