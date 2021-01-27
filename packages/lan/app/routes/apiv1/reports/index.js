import express from 'express';
import { createAdmissionsReport } from './admissions';
import { createIncompleteReferralsReport } from './incomplete-referrals';
import { createRecentDiagnosesReport } from './recent-diagnoses';

export const reports = express.Router();

reports.post('/admissions', createAdmissionsReport);
reports.post('/recent-diagnoses', createRecentDiagnosesReport);
reports.post('/incomplete-referrals', createIncompleteReferralsReport);
