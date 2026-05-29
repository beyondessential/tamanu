import express from 'express';
import { patientRoute } from './patient';

export const ai = express.Router();

ai.use('/patient', patientRoute);
