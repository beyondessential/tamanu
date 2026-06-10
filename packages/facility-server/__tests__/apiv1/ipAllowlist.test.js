import { SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Facility login IP allowlist', () => {
  let ctx;
  let baseApp;
  let models;

  const PASSWORD = 'allowlist-password';

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    await models.Setting.set('auth.ipAllowlist', [], SETTINGS_SCOPES.GLOBAL);
  });

  it('refuses out-of-range logins at the facility door, before any credential handling', async () => {
    await models.Setting.set('auth.ipAllowlist', ['10.0.0.0/8'], SETTINGS_SCOPES.GLOBAL);
    const response = await baseApp
      .post('/api/login')
      .send({ email: 'whoever@example.com', password: 'irrelevant', deviceId: 'd' });
    expect(response).toBeForbidden();
  });

  it('lets in-range logins through (and works offline — this is all local)', async () => {
    const user = await models.User.create(fake(models.User, { password: PASSWORD }));
    await models.Setting.set('auth.ipAllowlist', ['127.0.0.0/8'], SETTINGS_SCOPES.GLOBAL);
    const response = await baseApp
      .post('/api/login')
      .send({ email: user.email, password: PASSWORD, deviceId: 'allowlist-device' });
    expect(response).toHaveSucceeded();
  });

  it('gates the MFA completion and passwordless surfaces too', async () => {
    await models.Setting.set('auth.ipAllowlist', ['10.0.0.0/8'], SETTINGS_SCOPES.GLOBAL);
    const completion = await baseApp.post('/api/mfa/login/totp').send({ mfaToken: 'x', code: '1' });
    expect(completion).toBeForbidden();
    const passwordless = await baseApp.post('/api/login/webauthn/assert-begin');
    expect(passwordless).toBeForbidden();
  });
});
