import express from 'express';
import { getReports, getReportVersions, exportVersion } from './handlers';

export const reportsRouter = express.Router();

reportsRouter.get('/:reportId/versions/:versionId/export/:format', exportVersion);
reportsRouter.get('/:reportId/versions', getReportVersions);
reportsRouter.get('/', getReports);
