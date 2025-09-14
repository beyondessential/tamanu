import express from 'express';
import config from 'config';
import { suggestions } from '@tamanu/shared/services/suggestions';
import { authModule } from './auth';
import { patientDataRoutes } from './patientDataRoutes';

import { getSurvey, createSurveyResponse } from './handlers';

export const patientPortalModule = express.Router();

patientPortalModule.use(authModule);

patientPortalModule.use('/me', patientDataRoutes);

patientPortalModule.use('/survey/:surveyId', getSurvey);
patientPortalModule.use('/surveyResponse/:assignmentId', createSurveyResponse);

const allowedSuggesters = [];
if (Array.isArray(allowedSuggesters) && allowedSuggesters.length > 0) {
  const allowListMiddleware = names => (req, res, next) => {
    const firstSegment = (req.path || '').replace(/^\//, '').split('/')[0];
    if (!names.includes(firstSegment)) {
      res.status(404).end();
      return;
    }
    next();
  };

  patientPortalModule.use('/suggestions', allowListMiddleware(allowedSuggesters), suggestions);
}
