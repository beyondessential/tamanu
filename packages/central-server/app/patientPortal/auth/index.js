import express from 'express';

import { DEFAULT_JWT_SECRET } from '../../auth';
import { patientPortalLogin, requestLoginToken } from './patientPortalLogin';
import { patientPortalMiddleware } from './patientPortalMiddleware';

export const authModule = express.Router();

authModule.post('/login', patientPortalLogin({ secret: DEFAULT_JWT_SECRET }));
authModule.post('/request-login-token', requestLoginToken);

authModule.use(patientPortalMiddleware({ secret: DEFAULT_JWT_SECRET }));
