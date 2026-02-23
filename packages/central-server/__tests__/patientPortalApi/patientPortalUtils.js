import { PortalOneTimeTokenService } from '../../app/patientPortalApi/auth/PortalOneTimeTokenService';
import { PATIENT_PORTAL_COOKIE_NAME } from '../../app/patientPortalApi/auth/login';

function getTokenFromSetCookie(setCookie, name) {
  const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
  const match = cookieHeader?.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : undefined;
}

export const getPatientAuthToken = async (app, models, email) => {
  const portalUser = await models.PortalUser.getForAuthByEmail(email);
  const oneTimeTokenService = new PortalOneTimeTokenService(models);
  const { token } = await oneTimeTokenService.createLoginToken(portalUser.id);
  const loginResponse = await app.post('/api/portal/login').send({
    loginToken: token,
    email,
  });
  expect(loginResponse).toHaveSucceeded();
  const jwt = getTokenFromSetCookie(loginResponse.headers['set-cookie'], PATIENT_PORTAL_COOKIE_NAME);
  expect(jwt).toBeDefined();
  return jwt;
};
