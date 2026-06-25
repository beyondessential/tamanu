import express from 'express';
import { patientRoute } from './patient';
import { encounterRoute } from './encounter';

export const ai = express.Router();

ai.use('/patient', patientRoute);
ai.use('/encounter', encounterRoute);
