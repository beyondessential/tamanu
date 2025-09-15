import express from 'express';
import { authModule } from './auth';
import { patientDataRoutes } from './patientDataRoutes';

import { getSurvey, createSurveyResponse } from './handlers';
import { suggestionRoutes } from './suggestionRoutes';

export const patientPortalModule = express.Router();

patientPortalModule.use(authModule);

patientPortalModule.use('/me', patientDataRoutes);

patientPortalModule.use('/survey/:surveyId', getSurvey);
patientPortalModule.use('/surveyResponse/:assignmentId', createSurveyResponse);

patientPortalModule.use('/suggestions', suggestionRoutes);
