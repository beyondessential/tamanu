import express from 'express';
import { authModule } from './auth';
import { patientDataRoutes } from './patientData/patientDataRoutes';
import { getSurvey } from './general/survey';
import { createSurveyResponse } from './general/surveyResponse';

export const patientPortalModule = express.Router();

patientPortalModule.use(authModule);

patientPortalModule.use('/me', patientDataRoutes);

patientPortalModule.use('/survey/:surveyId', getSurvey);
patientPortalModule.use('/surveyResponse/:assignmentId', createSurveyResponse);
