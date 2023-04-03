import express from 'express';
import { getReports, importVersion } from './handlers';

export const reportsRouter = express.Router();

reportsRouter.post('/import', importVersion);
reportsRouter.get('/', getReports);
