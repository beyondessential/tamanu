import express from 'express';
import config from 'config';
import { patientPortalLogin, requestLoginToken } from './patientPortalLogin';
import { patientPortalMiddleware } from './patientPortalMiddleware';
import { verifyRegistration } from './verifyRegistration';

export const authModule = express.Router();

authModule.post('/login', patientPortalLogin({ secret: config.auth.secret }));
authModule.post('/request-login-token', requestLoginToken);
authModule.post('/verify-registration', verifyRegistration);

authModule.use(patientPortalMiddleware({ secret: config.auth.secret }));
