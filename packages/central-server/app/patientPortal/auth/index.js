import express from 'express';
import config from 'config';
import crypto from 'crypto';

import { patientPortalLogin } from './patientPortalLogin';
import { patientPortalMiddleware } from './patientPortalMiddleware';

// TODO: Look at using a different secret for patient portal
const DEFAULT_JWT_SECRET = config.auth.secret || crypto.randomUUID();

export const authModule = express.Router();

authModule.post('/login', patientPortalLogin({ secret: DEFAULT_JWT_SECRET }));

// TODO: Add refresh etc.

authModule.use(patientPortalMiddleware({ secret: DEFAULT_JWT_SECRET }));
