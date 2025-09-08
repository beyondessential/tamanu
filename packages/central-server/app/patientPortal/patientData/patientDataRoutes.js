import express from 'express';

import { getAllergies } from './allergies';
import { getPatient } from './patient';
import { getOngoingConditions } from './ongoingConditions';
import { getOngoingPrescriptions } from './ongoingPrescriptions';
import { getAdministeredVaccines, getUpcomingVaccinations } from './vaccinations';
import { getUpcomingAppointments } from './appointments';
import { getOutstandingSurveys, createSurveyResponse } from './surveys';

export const patientDataRoutes = express.Router();

patientDataRoutes.get('/', getPatient);

patientDataRoutes.get('/ongoing-conditions', getOngoingConditions);

patientDataRoutes.get('/allergies', getAllergies);

patientDataRoutes.get('/ongoing-prescriptions', getOngoingPrescriptions);

patientDataRoutes.get('/vaccinations/upcoming', getUpcomingVaccinations);

patientDataRoutes.get('/vaccinations/administered', getAdministeredVaccines);

patientDataRoutes.get('/appointments/upcoming', getUpcomingAppointments);

patientDataRoutes.get('/surveys/outstanding', getOutstandingSurveys);
patientDataRoutes.post('/surveys/:assignmentId', createSurveyResponse);
