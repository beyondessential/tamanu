import express from 'express';
import { DEFAULT_JWT_SECRET } from '../../auth';
import { patientPortalLogin, requestLoginToken } from './patientPortalLogin';
import { patientPortalMiddleware } from './patientPortalMiddleware';
import { verifyRegistration } from './verifyRegistration';

export const authModule = express.Router();

authModule.post('/login', patientPortalLogin({ secret: DEFAULT_JWT_SECRET }));
authModule.post('/request-login-token', requestLoginToken);
authModule.post('/verify-registration/:token?', verifyRegistration);

authModule.use(patientPortalMiddleware({ secret: DEFAULT_JWT_SECRET }));
