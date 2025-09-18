import express from 'express';

import {
  getAllergies,
  getPatient,
  getOngoingConditions,
  getOngoingPrescriptions,
  getAdministeredVaccines,
  getUpcomingVaccinations,
  getUpcomingAppointments,
  getOutstandingSurveys,
} from './handlers/patientData';

export const patientDataRoutes = express.Router();

patientDataRoutes.get('/', getPatient);
patientDataRoutes.get('/ongoing-conditions', getOngoingConditions);
patientDataRoutes.get('/allergies', getAllergies);
patientDataRoutes.get('/ongoing-prescriptions', getOngoingPrescriptions);
patientDataRoutes.get('/vaccinations/upcoming', getUpcomingVaccinations);
patientDataRoutes.get('/vaccinations/administered', getAdministeredVaccines);
patientDataRoutes.get('/appointments/upcoming', getUpcomingAppointments);
patientDataRoutes.get('/surveys/outstanding', getOutstandingSurveys);
