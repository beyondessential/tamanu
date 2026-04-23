import express from 'express';
import config from 'config';
import { getSurvey, createSurveyResponse, suggestionRoutes, getSettings } from './surveys';
import {
  getAdministeredVaccines,
  getAllergies,
  getOngoingConditions,
  getOngoingPrescriptions,
  getOutstandingSurveys,
  getPatient,
  getUpcomingAppointments,
  getUpcomingVaccinations,
  getProcedures,
} from './patientData';
import { register, login, requestLoginToken, patientPortalMiddleware } from './auth';

const passthrough = (_req, _res, next) => next();

// Exported as a factory so createApi can inject shared rate-limiter instances.
// The pre-auth endpoints (login, request-login-token, verify-registration)
// send emails and perform DB/bcrypt lookups, so must be rate-limited to
// mitigate brute-force and email-spam-via-token-request abuse.
export const patientPortalApi = ({ authLimiter } = {}) => {
  const limiter = authLimiter ?? passthrough;
  const router = express.Router();

  // Auth routes
  router.post('/login', limiter, login({ secret: config.auth.secret }));
  router.post('/request-login-token', limiter, requestLoginToken);
  router.post('/verify-registration', limiter, register);

  // Portal auth middleware
  router.use(patientPortalMiddleware({ secret: config.auth.secret }));

  // Patient data routes
  router.get('/me', getPatient);
  router.get('/me/ongoing-conditions', getOngoingConditions);
  router.get('/me/allergies', getAllergies);
  router.get('/me/ongoing-prescriptions', getOngoingPrescriptions);
  router.get('/me/vaccinations/upcoming', getUpcomingVaccinations);
  router.get('/me/vaccinations/administered', getAdministeredVaccines);
  router.get('/me/appointments/upcoming', getUpcomingAppointments);
  router.get('/me/procedures', getProcedures);
  router.get('/me/surveys/outstanding', getOutstandingSurveys);

  // Survey routes
  router.get('/settings/:facilityId', getSettings);
  router.get('/survey/:surveyId', getSurvey);
  router.post('/surveyResponse', createSurveyResponse);
  router.use('/suggestions', suggestionRoutes);

  return router;
};
