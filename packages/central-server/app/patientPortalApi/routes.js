import express from 'express';
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
import { DEFAULT_JWT_SECRET } from '../auth';
import { register, login, requestLoginToken, patientPortalMiddleware } from './auth';

export const patientPortalApi = express.Router();

// Auth routes
patientPortalApi.post('/login', login({ secret: DEFAULT_JWT_SECRET }));
patientPortalApi.post('/request-login-token', requestLoginToken);
patientPortalApi.post('/verify-registration', register);

// Portal auth middleware
patientPortalApi.use(patientPortalMiddleware({ secret: DEFAULT_JWT_SECRET }));

// Patient data routes
patientPortalApi.get('/me', getPatient);
patientPortalApi.get('/me/ongoing-conditions', getOngoingConditions);
patientPortalApi.get('/me/allergies', getAllergies);
patientPortalApi.get('/me/ongoing-prescriptions', getOngoingPrescriptions);
patientPortalApi.get('/me/vaccinations/upcoming', getUpcomingVaccinations);
patientPortalApi.get('/me/vaccinations/administered', getAdministeredVaccines);
patientPortalApi.get('/me/appointments/upcoming', getUpcomingAppointments);
patientPortalApi.get('/me/procedures', getProcedures);
patientPortalApi.get('/me/surveys/outstanding', getOutstandingSurveys);

// Survey routes
patientPortalApi.get('/settings/:facilityId', getSettings);
patientPortalApi.get('/survey/:surveyId', getSurvey);
patientPortalApi.post('/surveyResponse', createSurveyResponse);
patientPortalApi.use('/suggestions', suggestionRoutes);
