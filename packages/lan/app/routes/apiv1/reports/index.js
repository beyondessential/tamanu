import express from 'express';
import { createAdmissionsReport } from './admissions';

export const reports = express.Router();

reports.post('/admissions', createAdmissionsReport);
