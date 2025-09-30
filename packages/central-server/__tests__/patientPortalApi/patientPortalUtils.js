import { PortalOneTimeTokenService } from '../../app/patientPortalApi/auth/PortalOneTimeTokenService';

export const getPatientAuthToken = async (app, models, email) => {
  const portalUser = await models.PortalUser.getForAuthByEmail(email);
  const oneTimeTokenService = new PortalOneTimeTokenService(models);
  const { token } = await oneTimeTokenService.createLoginToken(portalUser.id);
  const loginResponse = await app.post('/api/portal/login').send({
    loginToken: token,
    email,
  });
  expect(loginResponse).toHaveSucceeded();
  return loginResponse.body.token;
};
