import express from 'express';

import { patientHandler } from '../../hl7fhir';

export const routes = express.Router();

routes.get('/Patient', patientHandler());
