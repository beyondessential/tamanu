import express from 'express';
import asyncHandler from 'express-async-handler';
import config from 'config';
import crypto from 'crypto';

import { patientPortalLogin } from './patientPortalLogin';
import { patientPortalMiddleware } from './patientPortalMiddleware';

export const DEFAULT_JWT_SECRET = config.auth.secret || crypto.randomUUID();

export const authModule = express.Router();

authModule.post('/login', patientPortalLogin({ secret: DEFAULT_JWT_SECRET }));

// TODO: Add refresh etc.

authModule.use(patientPortalMiddleware({ secret: DEFAULT_JWT_SECRET }));

// Temporary endpoint to test if patient portal middleware is working
authModule.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.send(req.patient);
  }),
);
