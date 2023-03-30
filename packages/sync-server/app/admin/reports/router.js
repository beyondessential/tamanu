import express from 'express';
import {
  createReportVersion,
  getReports,
  getReportVersions,
  updateReportVersion,
} from './handlers';

export const reportsRouter = express.Router();

reportsRouter.put('/:reportId/versions/:versionId', updateReportVersion);
reportsRouter.post('/:reportId/versions', createReportVersion);
reportsRouter.get('/:reportId/versions', getReportVersions);
reportsRouter.get('/', getReports);
